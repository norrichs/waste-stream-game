<script>
	import { onMount } from "svelte";
	import ScoreReport from "./components/ScoreReport.svelte";
	import Item from "./components/Item.svelte";

	import { flip } from "svelte/animate";
	import { quintOut } from "svelte/easing";

	const SPREADSHEET_ID = "process.env.SPREADSHEET_ID";
	const API_KEY = "process.env.API_KEY";

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

	let preLoadData = [];

	const writeResults = (results) => {
		console.log("results");
		//	0Auth 2 Client ID 102739973251168713720
		//	Service account email	waste-sort@sheetsdata-330421.iam.gserviceaccount.com
		const writeURL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`;

		fetch(writeURL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${ACCESS_TOKEN}`,
			},
			body: JSON.stringify({
				requests: [
					{
						repeatCell,
					},
				],
			}),
		});
	};

	const fetchPreLoad = async () => {
		// data pre-loader
		// try to get data to store as a immutable variable
		// use batch operation
		const range = "settings!A1:2";

		const gSheetUrl = "https://sheets.googleapis.com/v4/spreadsheets/";
		const settingsRange = "settings!A1:2";
		const itemsRange = "wasteItemsOutput!A1:E";
		const streamsRange = "wasteStreamsOutput!A1:F";
		const fetchURL =
			`${gSheetUrl}${SPREADSHEET_ID}/values:batchGet` +
			`?ranges=${settingsRange}` +
			`&ranges=${itemsRange}` +
			`&ranges=${streamsRange}` +
			`&key=${API_KEY}`;
		// `&valueRenderOption=UNFORMATTED_VALUES&majorDimension=COLUMNS` +
		// let response = await fetch(
		// 	`${gSheetUrl}${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`
		// );
		let response = await fetch(fetchURL);
		//	https://sheets.googleapis.com/v4/spreadsheets/spreadsheetId/values:batchGet?
		// 	ranges=Sheet1!B:B&ranges=Sheet1!D:D&valueRenderOption=UNFORMATTED_VALUES?majorDimension=COLUMNS
		let data = await response.json();
		return data.valueRanges;
	};
	const handleReset = () => {
		console.log("cached preload", preLoadData);
		const allSettings = convertSheetToObject([...preLoadData[0].values]);
		console.log("allsettings", allSettings);
		handleSettings(allSettings[0]);
		let allWasteItems = convertSheetToObject([...preLoadData[1].values]);
		console.log("unsanitized items", allWasteItems);
		let sanitizedWasteItems = sanitizeItems(allWasteItems);
		console.log("sanitized items", sanitizedWasteItems);
		wasteItems = selectItems(sanitizedWasteItems, wasteItemsCount);
		wasteStreams = convertSheetToObject([...preLoadData[2].values]);
		console.log("all and selected wasteItems", allWasteItems, wasteItems);
		console.log("wasteStreams", wasteStreams);
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
		// console.log(
		// 	"touchmove width height",
		// 	dragImg.style.width,
		// 	dragImg.style.height
		// );
		// get current cursor location
		let [x, y] = [
			ev.changedTouches[0].clientX - 25, //- dragImg.style.width / 2,
			ev.changedTouches[0].clientY - 25, // - dragImg.style.height / 2
		];
		// handle moving drag image
		dragImg.style.top = y + "px";
		dragImg.style.left = x + "px";

		// briefly hide dragImg
		dragImg.style.display = "none"

		// handle hover effect on targets
		const elementOver = document.elementFromPoint(x, y);
		if (elementOver?.classList.contains("drag-target")) {
			console.log("drag target touchmove over", elementOver)
			elementOver.classList.add("dropReady");
			lastElementOver = elementOver;
		} else {
			console.log("touchmove over", elementOver)
			lastElementOver?.classList.remove("dropReady");
		}
		// restore dragImg
		dragImg.style.display = "block";
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
			ev.changedTouches[0].clientY - 25, // - dragImg.style.height / 2,
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
	const sanitizeItems = (items) => {
		return items
			.filter((item) => item.waste_type !== undefined)
			.map((item) => {
				if (item.image === "" || item.image === "rb" || item.image === undefined) {
					item.image = "../images/no_image_transparent.png";
				}
				return item;
			});
	};

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
			if (randItemOfType === undefined) {
				console.log("type", type, itemsFilteredByType);
			} else {
				console.log("this random item of type...", randItemOfType);
			}
			const indexOfRandItemOfType = arr
				.map((item) => item.name)
				.indexOf(randItemOfType.name);
			selected.push(arr.splice(indexOfRandItemOfType, 1)[0]);
			console.log(
				"select items -> source size",
				arr.length,
				"selected size",
				selected.length
			);
		});

		let remaining = size - selected.length;
		while (remaining > 0) {
			selected.push(arr.splice(Math.random() * arr.length, 1)[0]);
			remaining -= 1;
			console.log(
				"remaining",
				remaining,
				"select items -> source size",
				arr.length,
				"selected size",
				selected.length
			);
		}
		return selected;
	};

	onMount(async () => {
		preLoadData = await fetchPreLoad();
		console.log("initial preload", preLoadData);
		handleReset();
	});
</script>

<main>
	<header>
		<img src="./images/MZYH_logo.png" alt="Make Zero Your Hero">
		<h1>UMass Waste Sort Game</h1>
		<!-- <button
			on:click={() => writeResults(["test", 1, 2, "recyclable", true])}
			>Test write</button
		> -->
	</header>
	<section class="sort-game">
		<ScoreReport {wasteStreams} {hiddenScoreReport} {handleReset} />
		<section class="drag-sources">
			{#each wasteItems as w, index (w.name)}
				<Item itemObj={w}>
					<img
						id={w.name}
						src={w.image}
						alt={w.name}
						draggable="true"
						on:dragstart={ev => dragstart(ev, index)}
						on:dragend={ev => dragend(ev)}
						on:touchstart|passive={(ev) => touchStart(ev)}
						on:touchend={(ev) => touchDrop(ev)}
						on:touchcancel={(ev) => touchCancel(ev)}
						on:touchmove={(ev) => touchMove(ev)}
					/>
				</Item>
		
			{/each}
		</section>
		<section class="drag-targets">
			{#each wasteStreams as s, index (s.name)}
				<div
					class="drag-target-container" 
					style="background-image: url('{s.image}')" >
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
					</div>
				</div>
			{/each}
		</section>
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
		box-sizing: border-box;

	}
	main > header {
		position: relative;
		display: flex;
		flex-direction: row;
		justify-content: center;
		background-color: var(--umass-red);
		height: 75px;
	}
	header > img {
		height: 100px;
		position: absolute;
		left: 30px;
		top: 10px;
	}
	header > h1{
		color: white;
	}
	section.sort-game{
		height: 100%;
		display: grid;
		grid-template-rows: 4fr 100px;
		grid-template-columns: 1fr 200px;
		background-image: url("../images/pond_chapel.png");
		background-size: cover;
		background-position: center bottom;
		/* filter: grayscale(100%) */

	}

	.drag-sources {
		grid-row: 1 / 2;
		grid-column: 1 / 3;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: flex-start;
		flex-wrap: wrap;
		padding: 30px;
		gap: 30px;
	}
	.drag-targets {
		padding: 15px;
		margin: 0 auto;
		grid-row: 2 / 3;
		grid-column: 1 / 3;
		/* width: 100%; */
		max-width: 90vw;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		gap: 15px;
		margin-bottom: 30px;
	}
	.drag-target-container{
		background-size: cover;
		background-position: center;
		border-radius: 10px;

		box-shadow: 0 0 20px 5px black


	}
	.drag-target {
		min-width: calc(var(--drag-box-height) * 0.6 * 2 );
		height: calc( var(--drag-box-height) * 0.6);
		background-color: transparent;
		display: grid;
		place-items: center;
		box-sizing: border-box;
		border-radius: 10px;
	}
	
	.drag-target.dropReady {
		color: white;
		/* border: 5px solid; */
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
			background-color: transparent;
			/* scale: 1; */
		}
		10% {
			background-color: red;
			box-shadow: 0 0 50px 5px red;
			/* scale: 1.5; */
		}
		to {
			background-color: transparent;
			/* scale: 1; */
		}
	}
	@keyframes flashGreen {
		from {
			background-color: transparent;
			/* scale: 1; */
		}
		10% {
			background-color: green;
			box-shadow: 0 0 50px 5px green;
			/* scale: 1.5; */
		}
		to {
			background-color: transparent;
			/* scale: 1; */
		}
	}
	@media screen and (max-width: 400px) {
		:root {
			--drag-box-height: 75px;
		}
	}
</style>
