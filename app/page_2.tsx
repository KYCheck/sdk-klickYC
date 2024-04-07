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


// IMAGES
import klickyc_white from "./klickyc_white.svg"
import klickyc_black from "./klickyc_black.svg"
import check from "./check.svg"
import cross from "./cross.svg"

interface transactionDataForHash {
	card: string,
	date: string,
	value: string
}

export default function KlickYC() {
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
			{page == "loading" ?
				<div className="h-[200px] flex items-center justify-center">
					<CircularProgress color="default" label="Loading..." />
				</div>
				:
				page == "verified" ?
					<div className="flex flex-col items-center justify-center">
						<Image src={check} alt="check" className="w-1/3" />
						<p className="m-6">Your registration has been approved.</p>
					</div>
					:
					page == "refused" ?
						<div className="flex flex-col items-center justify-center">
							<Image src={cross} alt="cross" className="w-1/3" />
							<p className="m-6">Your registration has been refused.</p>
						</div>
						:
						<>
							<Button color="primary" className="flex justify-center bg-gradient-to-r from-blue-900 to-blue-700 px-2 py-10 rounded-2xl" onPress={onOpen}>
								<div className="w-1/3 p-2 my-2">
									<Image src={klickyc_white} alt="Klickyc logo" />
								</div>
								<div className="w-2/3 flex flex-col justify-start items-start">
									<p className="text-md">Register with</p>
									<h3 className="text-2xl">KlickYC</h3>
								</div>
							</Button>
							<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
								<ModalContent>
									{(onClose) => (
										<>
											<ModalHeader className="flex items-center justify-center">
												<Image src={klickyc_black} alt="Klickyc logo" className="w-[35px] mx-2" />
												<h2 className="text-blue-900 mt-[5px]">KLICKYC</h2>
											</ModalHeader>
											<ModalBody>
												{page == "login" ?
													<div className="mb-4 w-full flex flex-col">
														<Input isRequired type="text" label="ENS" placeholder="Write your ENS here" labelPlacement="outside" value={ENS} onChange={(e:any) => setENS(e.target.value)} />
														<Button className="mt-6 bg-blue-900 text-white" onClick={handleVerify}>Connect</Button>
														<Link href="" className="text-gray-500 text-xs text-center mt-3" onClick={handleCreateAccount}>Create an account</Link>
													</div>
													:
													<div className="mb-2 w-full flex flex-col">
														<div className="mt-4">
															<p className="text-sm mb-2">ID <span className="text-red-500">*</span></p>
															<label htmlFor="file-upload" className="text-white text-sm block text-white text-sm bg-gradient-to-r from-blue-900 to-blue-700 w-full cursor-pointer py-2 px-4 rounded-lg shadow-md hover:opacity-80 focus:outline-none">
																{fileName}
															</label>
															<input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
														</div>
														<div className="mt-4">
															<Input isRequired type="text" label="Name" placeholder="Write your full name here" labelPlacement="outside" />
														</div>
														<div className="mt-4">
															<Input isRequired type="text" label="ENS" placeholder="Write your ENS here" labelPlacement="outside" value={ENS} onChange={(e:any) => setENS(e.target.value)}/>
														</div>
														<Button className="mt-6 bg-blue-900 text-white" onClick={handleRegister}>Connect</Button>
														<Link href="" className="text-gray-500 text-xs text-center mt-3" onClick={handleLogin}>I have an account</Link>
													</div>
												}
											</ModalBody>
										</>
									)}
								</ModalContent>
							</Modal>
						</>
			}
		</main >
	);
}

