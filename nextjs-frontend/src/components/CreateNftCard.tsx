'use client';

import React, { useState } from 'react';
import { useCreateNft } from '@/hooks/useNftTransactions';

const CreateNftCard = () => {
  const [name, setName] = useState('My NFT');
  const [symbol, setSymbol] = useState('MNFT');
  const [uri, setUri] = useState('https://example.com/nft.json');
  const [sellerFeeBasisPoints, setSellerFeeBasisPoints] = useState(500);
  const { createNft, loading, error, txSignature, nftMintAddress } = useCreateNft();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createNft(name, symbol, uri, sellerFeeBasisPoints);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold mb-4">Create NFT</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="nft-name" className="block text-gray-700 mb-2">Name:</label>
          <input
            type="text"
            id="nft-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="nft-symbol" className="block text-gray-700 mb-2">Symbol:</label>
          <input
            type="text"
            id="nft-symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="nft-uri" className="block text-gray-700 mb-2">URI:</label>
          <input
            type="text"
            id="nft-uri"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="seller-fee" className="block text-gray-700 mb-2">Seller Fee (basis points):</label>
          <input
            type="number"
            id="seller-fee"
            value={sellerFeeBasisPoints}
            onChange={(e) => setSellerFeeBasisPoints(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Create NFT'}
        </button>
      </form>
      {error && (
        <div className="mt-4 text-red-600">
          Error: {error}
        </div>
      )}
      {txSignature && nftMintAddress && (
        <div className="mt-4 text-green-600">
          <p>Success! Transaction: {txSignature.slice(0, 8)}...{txSignature.slice(-8)}</p>
          <p>NFT Mint Address: {nftMintAddress}</p>
        </div>
      )}
    </div>
  );
};

export default CreateNftCard;
