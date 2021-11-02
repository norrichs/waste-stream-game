<script>
import { onMount } from "svelte";

	import { flip } from "svelte/animate";
	import { quintOut } from "svelte/easing";
	// import {dotenv} from 'dotenv'

	// dotenv.config()
	const wasteItemsCount = 8;
	let wasteStreams = []
	let wasteItems = []
	// console.log( testKey )
	// console.log(testEnv)
	
	const fetchData = async (range) => {
		// GET DATA FROM GOOGLE SHEET

		const SPREADSHEET_ID = "process.env.SPREADSHEET_ID"
		const API_KEY = 'process.env.API_KEY'
		const gSheetUrl = "https://sheets.googleapis.com/v4/spreadsheets/"
		let response = await fetch(`${gSheetUrl}${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`)
		let data = await response.json()
		// console.log('data',data)
		return convertSheetToObject(data.values)
	}

	const convertSheetToObject = (arr) => {
		const [headings, ...data] = arr
		return data.map((item,i) => {
			let obj = {}
			item.forEach((value, i) => {
				
				switch(value){
					case '':
						obj[headings[i]] = ''
						break;
					case '[]':
						obj[headings[i]] = []
						break;
					case 'FALSE':
						obj[headings[i]] = false
						break;
					case 'TRUE':
						obj[headings[i]] = true
						break;
					default:
						if(value[0] === "[" && value[value.length-1] === "]"){
							let valuesArray = value.substr(1,value.length-2).split(",").map(str=>str.trim())
							// console.log('array',valuesArray)
							obj[headings[i]] = valuesArray
						}else{
							obj[headings[i]] = value
						}

						break;		
				} 
			})
			return obj
		})
	}

	const dragstart = (e, i) => {
		e.dataTransfer.setData("text/plain", wasteItems[i].name);
		const dragImg = document.getElementById(e.target.id);
		e.target.style.opacity = 0.25;
		e.dataTransfer.setDragImage(dragImg, 50, 50);
	};
	const dragend = (e) => {
		e.target.style.opacity = 1;
	};
	const dragenter = (e) => {
		// TODO insert an element?
	};
	const drop = (e, i) => {
		const wasteItemName = e.dataTransfer.getData("text/plain");
		const itemIndex = wasteItems
			.map((item) => item.name)
			.indexOf(wasteItemName);
		wasteStreams[i].incorrectTransitory = wasteItems[itemIndex].waste_type.includes(wasteStreams[i].waste_type) ? false : true
		wasteStreams[i].correctTransitory = wasteItems[itemIndex].waste_type.includes(wasteStreams[i].waste_type) ? true : false
		wasteStreams[i].items.push(wasteItems.splice(itemIndex, 1)[0]);
		wasteStreams = wasteStreams;
		wasteItems = wasteItems;
	};
	const calcScore = (w) => {
		return w.reduce((acc, stream) => {
			if (stream.items.length === 0) return acc;
			else
				return (
					acc +
					stream.items.reduce((acc, item) => {
						return item.waste_type.includes(stream.waste_type)
							? acc + 1
							: acc;
					}, 0)
				);
		}, 0);
	};


	// From the set of all wasteItems, select items equal to 'size'
	// Algo - 
	//		Loop through unique types
	//			Filter items by a type, then choose a random item from filtered list.
	//			Use picked item to get an index for that item.  Splice it and add to 'selected' array




	const selectItems = (arr, size) => {
		console.log('arr', arr, 'size', size)
		let selected = []
		let uniqueTypes = []
		// Construct list of unique waste_types
		arr.forEach(item=>{
			item.waste_type.forEach(type=>{
				if(!uniqueTypes.includes(type)) uniqueTypes.push(type) 
			})
		})

		// Loop through unique types, filter arr by type, 
		//		choose a random item, get index of item
		//		splice from arr into selected
		uniqueTypes.forEach(type => {
			const itemsFilteredByType = arr.filter(item => {
				return item.waste_type.includes(type)
			})
			const randItemOfType = itemsFilteredByType[Math.floor(Math.random() * itemsFilteredByType.length)]
			const indexOfRandItemOfType = arr.map(item=>item.name).indexOf(randItemOfType.name)
			selected.push(arr.splice(indexOfRandItemOfType,1)[0])

		})
		let remaining = size - selected.length
		while(remaining > 0){
			selected.push(arr.splice(Math.random() * arr.length)[0])
			remaining -= 1
		}
		return selected
	}


	let sortScore;
	$: {
		sortScore = calcScore(wasteStreams);
	}

	const getSheetsData = () => {
		console.log('get data')
		
	}
	onMount(async ()=>{
		const allWasteItems = await fetchData('wasteItemsOutput')
		wasteItems = selectItems(allWasteItems, wasteItemsCount)
		wasteStreams = await fetchData('wasteStreamsOutput')
		console.log('fetchedWasteItems', wasteItems)
		console.log('fetched Waste Streams', wasteStreams)
	})


</script>

<main>
	<section class="experimental">
		<button on:click={async ()=>{console.log(await fetchData('experimental!A1:c4'))}}>get data</button>
	</section>
	<section class="drag-area">
		<div class="drag-sources">
			{#each wasteItems as w, index (w.name)}
				<div
					animate:flip={{
						delay: 250,
						duration: 400,
						easing: quintOut,
					}}
					class="drag-box"
				>
					<header class="drag-box-header">{w.name}</header>
					<div>
						<img
							id={w.name}
							src={w.image}
							alt={w.name}
							draggable="true"
							on:dragstart={(event) => {
								dragstart(event, index);
							}}
							on:dragend={(event) => {
								dragend(event);
							}}
						/>
						{w.waste_type}
					</div>
				</div>
			{/each}
		</div>
		<div class="drag-targets">
			{#each wasteStreams as s, index (s.name)}
				<div
					class="drag-target"
					class:dropReady={s.dropReady}
					class:incorrectTransitory={s.incorrectTransitory}
					class:correctTransitory={s.correctTransitory}
					on:drop={(event) => {
						s.dropReady = false;
						drop(event, index);
					}}
					on:dragenter|preventDefault={(event) => {
						s.incorrectTransitory = false;
						s.correctTransitory = false;
						s.dropReady = true;
						dragenter(event);
					}}
					on:dragover|preventDefault
					on:dragleave={(event) => {
						s.dropReady = false;
					}}
				>
					{s.name}
				</div>
			{/each}
		</div>
	</section>
	<section class="score">
		<h2>Score: {sortScore}</h2>
		{#if wasteItems.length === 0}
			<div>Report:</div>
			{#each wasteStreams as s}
				<h4>{s.name}</h4>
				<ul>
					{#each s.items as item}
						<li
							class={item.waste_type.includes(s.waste_type)
								? "correct"
								: "incorrect"}
						>
							<span>{item.name}</span>
							<span
								>{item.waste_type.includes(s.waste_type)
									? item.correct
									: item.incorrect}</span
							>
						</li>
					{/each}
				</ul>
			{/each}
		{/if}
	</section>
</main>

<style>
	:root {
		--drag-box-height: 175px;
	}
	section.drag-area {
		margin: 0 auto;
		width: 90vw;
		/* height: 60vh; */
		/* background-color: beige; */
		display: grid;
		grid-template-rows: 2fr 1fr 200px;
	}
	.drag-sources {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 30px;
		margin-bottom: 100px;
	}
	.drag-box {
		width: var(--drag-box-height);
		height: var(--drag-box-height);
		border: 1px solid black;
		/* position: absolute; */
	}
	.drag-box > div {
		overflow: hidden;
	}
	.drag-box > div > img {
		object-fit: contain;
		height: var(--drag-box-height);
		width: var(--drag-box-height);
	}
	.drag-box header {
		/* width: 100%; */
		background-color: brown;
		color: white;
		padding: 5px;
	}
	.drag-targets {
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		gap: 30px;
	}
	.drag-target {
		font-size: 1.5em;
		width: var(--drag-box-height);
		height: var(--drag-box-height);
		background-color: grey;
		border: 2px solid black;
		display: grid;
		place-items: center;
		box-sizing: border-box;
	}
	.drag-target.dropReady {
		color: magenta;
		border: 5px solid;
		box-shadow: 0 0 50px 10px;
		transition: 400ms;
	}
	.score {
		padding: 30px;
		background-color: aliceblue;
		margin: 0 auto;
		max-width: 500px;
		display: flex;
		flex-direction: column;
	}
	.correct,
	.incorrect {
		padding: 5px;
		border-radius: 5px;
		border: 1px solid;
		margin: 3px;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}
	.correct {
		color: green;
		background-color: lightgreen;
	}
	.incorrect {
		color: red;
		background-color: lightpink;
		text-decoration: line-through;
	}
	div.drag-target.correctTransitory {
		animation-duration: 1.5s;
		animation-name: flashGreen;
	}
	div.drag-target.incorrectTransitory{
		animation-duration: 1.5s;
		animation-name: flashRed;
	}

	@keyframes flashRed{
		from{
			background-color: grey;
			scale: 1;
		}
		10%{
			background-color: red;
			scale: 1.5;
		}
		to{
			background-color: grey;
			scale: 1;
		}
	}
	@keyframes flashGreen{
		from{
			background-color: grey;
			scale: 1;
		}
		10%{
			background-color: green;
			scale: 1.5;
		}
		to{
			background-color: grey;
			scale: 1;
		}
	}
</style>
