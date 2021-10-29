<script>
import { onMount } from "svelte";

	import { flip } from "svelte/animate";
	import { quintOut } from "svelte/easing";

	let wasteStreams = []
	let wasteItems = []

	const fetchData = async (range) => {
		// GET DATA FROM GOOGLE SHEET
		const SPREADSHEET_ID = '1w9veOiBf9shl9ZdgzUtDh17ixrwfntTweRCbPjAzwPg'
		// const RANGE = 'w!A1:e'
		const API_KEY = "AIzaSyAvDr2Y3SqcxcAZF9g-UA7_WQgitMMj4fY";
		const gSheetUrl = "https://sheets.googleapis.com/v4/spreadsheets/"
		let response = await fetch(`${gSheetUrl}${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`)
		let data = await response.json()
		return convertSheetToObject(data.values)
	}

	const convertSheetToObject = (arr) => {
		const [headings, ...data] = arr
		return data.map((item,i) => {
			let obj = {}
			item.forEach((value, i) => {
				switch(value){
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
						obj[headings[i]] = value
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
		console.log("dragend()");
		e.target.style.opacity = 1;
	};
	const dragenter = (e) => {
		console.log("dragenter()", e);
		// TODO insert an element?
	};
	const drop = (e, i) => {
		const wasteItemName = e.dataTransfer.getData("text/plain");
		const itemIndex = wasteItems
			.map((item) => item.name)
			.indexOf(wasteItemName);
		console.log("drop()", wasteItemName);
		wasteStreams[i].incorrectTransitory = wasteItems[itemIndex].waste_type !== wasteStreams[i].waste_type
		wasteStreams[i].correctTransitory = wasteItems[itemIndex].waste_type === wasteStreams[i].waste_type
		console.log('set incorrectTransitory', wasteStreams[i].incorrectTransitory)
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
						return item.waste_type === stream.waste_type
							? acc + 1
							: acc;
					}, 0)
				);
		}, 0);
	};

	let sortScore;
	$: {
		sortScore = calcScore(wasteStreams);
	}

	const getSheetsData = () => {
		console.log('get data')
		
	}
	onMount(async ()=>{
		wasteItems = await fetchData('wasteItems!A1:E')
		wasteStreams = await fetchData('wasteStreams!A1:E')
		// console.log('fetchedWasteItems', wasteItems)
		// console.log('fetched Waste Streams', wasteStreams)
	})


</script>

<main>
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
						console.log("dragleave()");
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
							class={item.waste_type === s.waste_type
								? "correct"
								: "incorrect"}
						>
							<span>{item.name}</span>
							<span
								>{item.waste_type === s.waste_type
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
		grid-template-rows: 1fr 200px;
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
