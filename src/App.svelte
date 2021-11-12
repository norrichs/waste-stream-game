<script>
	import { onMount } from "svelte";
	import ScoreReport from "./components/ScoreReport.svelte";

	import { flip } from "svelte/animate";
	import { quintOut } from "svelte/easing";

	let wasteItemsCount = 8;
	let adminMode = false;
	let wasteStreams = [];
	let wasteItems = [];
	let settings = [];
	let lastElementOver;
	let hiddenScoreReport = true;
	$: {
		if (wasteItems.length === 0) {
			document
				.querySelector("body.scroll-controlled")
				.classList.add("stop-scrolling");
			hiddenScoreReport = false;
		} else hiddenScoreReport = true;
	}

	const fetchData = async (range) => {
		// GET DATA FROM GOOGLE SHEET

		const SPREADSHEET_ID = "process.env.SPREADSHEET_ID";
		const API_KEY = "process.env.API_KEY";
		const gSheetUrl = "https://sheets.googleapis.com/v4/spreadsheets/";
		let response = await fetch(
			`${gSheetUrl}${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`
		);
		let data = await response.json();
		// console.log('data',data)
		return convertSheetToObject(data.values);
	};

	// Constructs a structured JS object based on data found in sheet
	//	Not-generalizable.  Has special behavior to interpret arrays and booleans
	const convertSheetToObject = (arr) => {
		const [headings, ...data] = arr;
		return data.map((item, i) => {
			let obj = {};
			item.forEach((value, i) => {
				switch (value) {
					case "":
						obj[headings[i]] = "";
						break;
					case "[]":
						obj[headings[i]] = [];
						break;
					case "FALSE":
						obj[headings[i]] = false;
						break;
					case "TRUE":
						obj[headings[i]] = true;
						break;
					default:
						if (
							value[0] === "[" &&
							value[value.length - 1] === "]"
						) {
							let valuesArray = value
								.substr(1, value.length - 2)
								.split(",")
								.map((str) => str.trim());
							obj[headings[i]] = valuesArray;
						} else {
							obj[headings[i]] = value;
						}

						break;
				}
			});
			return obj;
		});
	};

	const handleSettings = (settings) => {
		console.log(settings);
		wasteItemsCount = parseInt(settings.wasteItemsCount);
		adminMode = settings.adminMode;
	};

	//  Drag event handler functions
	// 	Not for touch-based inputs

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
		wasteStreams[i].incorrectTransitory = wasteItems[
			itemIndex
		].waste_type.includes(wasteStreams[i].waste_type)
			? false
			: true;
		wasteStreams[i].correctTransitory = wasteItems[
			itemIndex
		].waste_type.includes(wasteStreams[i].waste_type)
			? true
			: false;
		wasteStreams[i].items.push(wasteItems.splice(itemIndex, 1)[0]);
		wasteStreams = wasteStreams;
		wasteItems = wasteItems;
	};
	const touchStart = (ev) => {
		// append a touchmove element
		ev.target.style.opacity = "0.3";
		const [x, y] = [
			ev.changedTouches[0].clientX - 25,
			ev.changedTouches[0].clientY - 25,
		];
		console.log("touchstart", ev, x, y);
		const parentElement = document.querySelector("main");
		const dragImg = document.createElement("img");
		dragImg.setAttribute("src", ev.target.src);
		dragImg.setAttribute("id", "drag-image-id");
		dragImg.style.width = "50px";
		dragImg.style.position = "absolute";
		dragImg.style.top = y + "px";
		dragImg.style.left = x + "px	";
		dragImg.classList.add("drag-image");
		parentElement.appendChild(dragImg);
		console.log(document.querySelector("#drag-image-id").style.top);

		// remove all 'transitory effects'
		wasteStreams = wasteStreams.map((s) => {
			s.incorrectTransitory = false;
			s.correctTransitory = false;
			return s;
		});
	};

	const touchMove = (ev) => {
		const dragImg = document.querySelector("#drag-image-id");
		console.log('touchmove width height', dragImg.style.width, dragImg.style.height)
		// get current cursor location
		let [x, y] = [
			ev.changedTouches[0].clientX - 25 ,//- dragImg.style.width / 2,
			ev.changedTouches[0].clientY - 25// - dragImg.style.height / 2
		];
		// handle moving drag image
		dragImg.style.top = y + "px";
		dragImg.style.left = x + "px";

		// handle hover effect on targets
		const elementOver = document.elementFromPoint(x, y);
		if (elementOver?.classList.contains("drag-target")) {
			// console.log("touchmove over", elementOver)
			elementOver.classList.add("dropReady");
			lastElementOver = elementOver;
		} else {
			lastElementOver?.classList.remove("dropReady");
		}
	};
	const touchCancel = (ev) => {
		console.log("touch cancelled");
		ev.target.style.opacity = "1";
		document.querySelector("#drag-image-id").remove();
		document
			.querySelector("body.scroll-controlled")
			.classList.remove("stop-scrolling");
	};
	const touchDrop = (ev) => {
		const dragImg = document.querySelector("#drag-image-id");
		const [x, y] = [
			ev.changedTouches[0].clientX - 25, // - dragImg.style.width / 2,
			ev.changedTouches[0].clientY - 25// - dragImg.style.height / 2,
		];
		
		document.querySelector("#drag-image-id").remove();
		ev.target.style.opacity = "1";
		
		const dropTargetElement = document.elementFromPoint(x, y);
		console.log("untested drop target", dropTargetElement);
		if (dropTargetElement?.classList.contains("drag-target")) {
			console.log("valid drop target", dropTargetElement);
			const i = wasteStreams
				.map((stream) => stream.name)
				.indexOf(dropTargetElement.id);
			// const stream = wasteStreams[i];
			const itemIndex = wasteItems
				.map((item) => item.name)
				.indexOf(ev.target.id);
			wasteStreams[i].incorrectTransitory = wasteItems[
				itemIndex
			].waste_type.includes(wasteStreams[i].waste_type)
				? false
				: true;
			wasteStreams[i].correctTransitory = wasteItems[
				itemIndex
			].waste_type.includes(wasteStreams[i].waste_type)
				? true
				: false;
			wasteStreams[i].items.push(wasteItems.splice(itemIndex, 1)[0]);
			wasteItems = wasteItems;
			wasteStreams = wasteStreams;
			console.log("wasteItems", wasteItems, "wasteStreams", wasteStreams);
		}
	};

	// From the set of all wasteItems, select items equal to 'size'
	// Algo -
	//		Loop through unique types
	//			Filter items by a type, then choose a random item from filtered list.
	//			Use picked item to get an index for that item.  Splice it and add to 'selected' array

	const selectItems = (arr, size) => {
		console.log("select from:", [...arr], "size", size);
		let selected = [];
		let uniqueTypes = [];
		// Construct list of unique waste_types
		arr.forEach((item) => {
			item.waste_type.forEach((type) => {
				if (!uniqueTypes.includes(type)) uniqueTypes.push(type);
			});
		});

		// Loop through unique types, filter arr by type,
		//		choose a random item, get index of item
		//		splice from arr into selected
		uniqueTypes.forEach((type) => {
			const itemsFilteredByType = arr.filter((item) => {
				return item.waste_type.includes(type);
			});
			const randItemOfType =
				itemsFilteredByType[
					Math.floor(Math.random() * itemsFilteredByType.length)
				];
			const indexOfRandItemOfType = arr
				.map((item) => item.name)
				.indexOf(randItemOfType.name);
			selected.push(arr.splice(indexOfRandItemOfType, 1)[0]);
		});
		let remaining = size - selected.length;
		while (remaining > 0) {
			selected.push(arr.splice(Math.random() * arr.length)[0]);
			remaining -= 1;
		}
		selected = selected.map((item) => {
			if (item.image === "")
				item.image = "../images/no_image_transparent.png";
			return item;
		});
		return selected;
	};

	const getSheetsData = () => {
		console.log("get data");
	};

	// Initial data setup
	// 	Fetches all data from Google Sheet.
	//	Selects random items to play sorting game

	// TODO -
	//	Fetch settings (# of items to be selected?  anything else?)
	onMount(async () => {
		settings = await fetchData("settings!A1:2");
		const allWasteItems = await fetchData("wasteItemsOutput!A1:18");
		handleSettings(settings[0]);
		wasteItems = selectItems(allWasteItems, wasteItemsCount);
		console.log("fetched and selected wasteItems", allWasteItems, wasteItems);
		wasteStreams = await fetchData("wasteStreamsOutput");
		console.log("fetched wasteStreams", wasteStreams);
	});
</script>

<main>
	<header>
		<h2>Waste-sort</h2>
	</header>
	<ScoreReport {wasteStreams} {hiddenScoreReport} />
	<section class="drag-sources">
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
						on:touchstart|passive={(ev) => touchStart(ev)}
						on:touchend={(ev) => touchDrop(ev)}
						on:touchcancel={(ev) => touchCancel(ev)}
						on:touchmove={(ev) => touchMove(ev)}
					/>

					{#if adminMode}
						<p class="admin-message">
							{w.waste_type}
						</p>
					{/if}
				</div>
			</div>
		{/each}
	</section>
	<section class="drag-targets">
		{#each wasteStreams as s, index (s.name)}
			<div
				id={s.name}
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
	</section>
</main>

<style>
	:root {
		--drag-box-height: 125px;
		--umass-red: rgb(136, 28, 28);
		--drag-box-height-mobile: 75px;
	}
	main {
		position: relative;
		margin: 0 auto;
		height: 100%;
		width: 100%;

		display: grid;
		grid-template-rows: 50px 4fr 1fr;
		grid-template-columns: 1fr 200px;
		background-image: url("../images/pond_chapel.png");
		background-position-x: center;
		/* filter: grayscale(100%) */
		object-fit: cover;
		box-sizing: border-box;
	}

	.drag-sources {
		grid-row: 2 / 3;
		grid-column: 1 / 3;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: flex-start;
		flex-wrap: wrap;
		padding: 30px;
		gap: 30px;
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
		background-color: var(--umass-red);
		color: white;
		padding: 5px;
	}
	.drag-targets {
		padding: 15px;
		margin: 0 auto;
		grid-row: 3 / 4;
		grid-column: 1 / 3;
		/* width: 100%; */
		max-width: 90vw;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		gap: 15px;
		background-color: rgba(0, 0, 0, 0.75);
		transform: translateZ(1000);
	}
	.drag-target {
		font-size: 1.5em;
		min-width: var(--drag-box-height);
		height: var(--drag-box-height);
		background-color: grey;
		border: 2px solid black;
		display: grid;
		place-items: center;
		box-sizing: border-box;
		padding: 15px;
	}
	.drag-target:hover {
		background-color: magenta;
	}
	.drag-target.dropReady {
		color: magenta;
		border: 5px solid;
		box-shadow: 0 0 50px 10px;
		transition: 400ms;
	}

	div.drag-target.correctTransitory {
		animation-duration: 1.5s;
		animation-name: flashGreen;
	}
	div.drag-target.incorrectTransitory {
		animation-duration: 1.5s;
		animation-name: flashRed;
	}
	#drag-image-id {
		width: 10px;
	}

	@keyframes flashRed {
		from {
			background-color: grey;
			scale: 1;
		}
		10% {
			background-color: red;
			scale: 1.5;
		}
		to {
			background-color: grey;
			scale: 1;
		}
	}
	@keyframes flashGreen {
		from {
			background-color: grey;
			scale: 1;
		}
		10% {
			background-color: green;
			scale: 1.5;
		}
		to {
			background-color: grey;
			scale: 1;
		}
	}
	@media screen and (max-width: 400px) {
		:root{
			--drag-box-height: 75px;
		}
	}
</style>
