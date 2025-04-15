use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer, Burn};
use crate::state::{BondingCurvePool, UserAccount};
use crate::math::bonding_curve::BondingCurve;

#[derive(Accounts)]
pub struct SellToken<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"user-account", seller.key().as_ref()],
        bump,
    )]
    pub user_account: Account<'info, UserAccount>,
    
    #[account(
        mut,
        seeds = [b"bonding-pool", real_token_mint.key().as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, BondingCurvePool>,
    
    pub real_token_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [b"synthetic-mint", real_token_mint.key().as_ref()],
        bump,
    )]
    pub synthetic_token_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [b"token-vault", real_token_mint.key().as_ref()],
        bump,
    )]
    pub real_token_vault: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = seller_token_account.owner == seller.key(),
        constraint = seller_token_account.mint == real_token_mint.key(),
    )]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = seller_synthetic_token_account.owner == seller.key(),
        constraint = seller_synthetic_token_account.mint == synthetic_token_mint.key(),
    )]
    pub seller_synthetic_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn sell_token(ctx: Context<SellToken>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let user = &mut ctx.accounts.user_account;
    
    // Ensure pool has enough tokens
    require!(
        pool.current_market_cap >= amount,
        crate::errors::ErrorCode::InsufficientPoolBalance
    );
    
    // Create bonding curve instance
    let bonding_curve = BondingCurve {
        base_price: pool.base_price,
        growth_factor: pool.growth_factor,
    };
    
    // Calculate amount to receive
    let total_receive = bonding_curve.calculate_sell_amount(pool.current_market_cap, amount)?;
    
    // Calculate platform fee
    let platform_fee = bonding_curve.calculate_platform_fee(total_receive)?;
    
    // Calculate net amount (total - fee)
    let net_receive = bonding_curve.calculate_net_cost(total_receive)?;
    
    // Burn synthetic tokens from seller
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.synthetic_token_mint.to_account_info(),
                from: ctx.accounts.seller_synthetic_token_account.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        ),
        amount,
    )?;
    
    // Transfer real tokens from pool to seller
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.real_token_vault.to_account_info(),
                to: ctx.accounts.seller_token_account.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            &[&[
                b"bonding-pool",
                ctx.accounts.real_token_mint.key().as_ref(),
                &[pool.bump],
            ]],
        ),
        net_receive,
    )?;
    
    // Update pool state
    pool.current_market_cap = pool.current_market_cap.checked_sub(amount).unwrap();
    pool.total_supply = pool.total_supply.checked_sub(amount).unwrap();
    
    // Update price history
    let current_price = bonding_curve.calculate_price(pool.current_market_cap)?;
    pool.price_history[pool.price_history_idx as usize] = current_price;
    pool.price_history_idx = (pool.price_history_idx + 1) % 10;
    
    // Update user state
    user.synthetic_sol_balance = user.synthetic_sol_balance.checked_sub(amount).unwrap();
    user.real_sol_balance = user.real_sol_balance.checked_add(platform_fee).unwrap();
    
    Ok(())
}
