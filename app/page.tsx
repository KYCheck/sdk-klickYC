"use client"

// LIBRARIES
import { SHA256 } from "crypto-js";
import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from 'next/navigation';
import lighthouse from '@lighthouse-web3/sdk';
import { useAccount, useSignMessage } from 'wagmi';
import { signMessage } from '@wagmi/core';
import { config } from './config'
import axios from "axios";
import KlickYC from "provehence-front4/app/page_2"


// IMAGES
// import klickyc_white from "@/public/klickyc_white.svg"
// import klickyc_black from "@/public/klickyc_black.svg"
// import check from "@/public/check.svg"
// import cross from "@/public/cross.svg"

interface transactionDataForHash {
	card: string,
	date: string,
	value: string
}

export default function Home() {
	const searchParams = useSearchParams()

	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const [page, setPage] = useState("login");
	const [fileName, setFileName] = useState("Import your ID");
  	const [ENS, setENS] = useState("");

	const url = 'https://gateway.lighthouse.storage/ipfs/QmZG9DqYLsWh38jTaHyecD2Y38237XSyNfHy2TqYd3n2iT';

	// CODE TO ACCESS_TOKEN REQUEST
	useEffect(() => {
    setENS(""+localStorage.getItem('ENS'));
		const code = searchParams.get('code');

		if (code != undefined) {
			const data = {
				code: code,
				client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
				client_secret: process.env.NEXT_PUBLIC_CLIENT_SECRET,
			};

			console.log('Code:', code);
			console.log('Client ID:', data.client_id);
			console.log('Secret:', data.client_secret);

			fetch(`https://${process.env.NEXT_PUBLIC_DOMAINE}-sandbox.biapi.pro/2.0/auth/token/access`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			})
				.then((response: any) => response.json())
				.then((data: any) => {
					console.log(data);
					console.log('Access Token:', data.access_token);
					getTransaction(data.access_token);
				})
				.catch((error: any) => {
					console.error('Error:', error);
				});
		}
	}, []);

	// TRANSACTIONS API CALL
	function getTransaction(accessToken: string) {
		console.log("Access Token: " + accessToken);
		fetch(`https://${process.env.NEXT_PUBLIC_DOMAINE}-sandbox.biapi.pro/2.0//users/me/transactions?limit=1000`, {
			method: 'GET',
			headers: {
				'Authorization': 'Bearer ' + accessToken,
				'Content-Type': 'application/json'
			}
		})
			.then((response) => response.json())
			.then(data => {
				const dataForHash = getFirstTransaction(data);

				console.log(dataForHash)
			})
			.catch(error => {
				console.error('Error:', error);
			});
	}

	// TRANSACTION PARSER
	async function getFirstTransaction(data: any) {
		setPage("loading")

		const transactionData = data.transactions[data.total - 1];

		const transactionDataForHash = {
			card: transactionData.card,
			date: transactionData.date,
			value: Math.abs(transactionData.value).toString()
		}

		// const name = 'KlickYC';
    const ENS = ""+ localStorage.getItem('ENS');
    console.log('ENS:', ENS)
		const hash = generateHash(ENS, transactionDataForHash);
		console.log(hash)

		const apiKey = "" + process.env.NEXT_PUBLIC_LIGHTHOUSE;

		console.log('Register:', localStorage.getItem('register'))

		if (localStorage.getItem('register') == 'true') { // PUSH NEW INSTANCE WHEN REGISTER
			const uploadResponse = await lighthouse.uploadText(hash, apiKey, ENS)
			let urlEndpoint = uploadResponse.data.Hash
			console.log('Uploaded to IPFS:', urlEndpoint)
			console.log('URL:', url)
			setPage("verified")
		}
		else { // COMPARE THE HASH IF LOGIN
			const hashTest = generateHash(ENS, transactionDataForHash);
			console.log('Hash Test:', hashTest)
			const hashData = fetchData();
			console.log('Hash Data:', hashData)
			if (hashTest == await hashData) {
				setPage("verified")
			} else {
				setPage("refused")
			}
		}
	}

	async function fetchData() {
		try {
			console.log('URL:', url)
			const response = await axios.get(url);
			console.log(response.data); // This will log the data fetched from the URL
			return response.data;
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	}

	function generateHash(name: String, transaction: transactionDataForHash) {
		const transactionString = JSON.stringify(transaction);
		const toHash = `${name}${transactionString}`;
		const hash = SHA256(toHash).toString();
		return hash;
	}

	// SIGN
	async function handleSign() {
		await signMessage(config, { message: 'Prove that this wallet is yours! (KlickYC)' });
	}

	// FRONT
	function handleFileChange(event: any) {
		const file = event.target.files[0];
		if (file) {
			setFileName(file.name);
		} else {
			setFileName('Import your ID');
		}
	};

	function handleCreateAccount() {
		setPage("create-account");
	}

	function handleLogin() {
		setPage("login");
	}

	async function handleRegister() {
    localStorage.setItem('ENS', ENS);
		localStorage.setItem('register', 'true');
		handleSign().then(() => {
			window.location.href = "https://londres-sandbox.biapi.pro/2.0/auth/webview/en/connect?client_id=63744200&redirect_uri=https://klickyc.vercel.app/"
		})
	}

	async function handleVerify() {
    localStorage.setItem('ENS', ENS);
    localStorage.setItem('register', 'false');
		window.location.href = "https://londres-sandbox.biapi.pro/2.0/auth/webview/en/connect?client_id=63744200&redirect_uri=https://klickyc.vercel.app/"
	}

	return (
		<main className="flex min-h-screen w-full items-center justify-center">
			<KlickYC/>
		</main >
	);
}


