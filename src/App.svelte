<script>
	import { onMount } from "svelte";
	import ScoreReport from "./components/ScoreReport.svelte";
	import Item from "./components/Item.svelte";
	import Modal from "./components/Modal.svelte";

	const SPREADSHEET_ID = "process.env.SPREADSHEET_ID";
	const API_KEY = "process.env.API_KEY";

	let wasteItemsCount = 8;
	let itemsPerRowMobile = 3;
	let itemsPerRowDefault = 4;
	let adminMode = false;
	let wasteStreams = [];
	let wasteItems = [];
	let settings = [0];
	let lastElementOver;
	let showReport = true;
	let showWelcome = true;
	let showCertificate = false;
	let welcomeCopy = [];
	let isMouseDown = false;
	let dragItemName = null;

	$: {
		if (wasteItems.length === 0) {
			document
				.querySelector("body.scroll-controlled")
				.classList.add("stop-scrolling");
			showReport = true;
		} else showReport = false;
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
		let response = await fetch(fetchURL);
		let data = await response.json();
		return data.valueRanges;
	};
	const handleReset = () => {
		document
			.querySelector("body.scroll-controlled")
			.classList.remove("stop-scrolling");

		console.log("cached preload", preLoadData);
		const allSettings = convertSheetToObject([...preLoadData[0].values]);
		settings = [...allSettings];
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

	const handleDone = () => {
		showCertificate = true;
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
		welcomeCopy = settings.welcomeText.split("\n");
		itemsPerRowMobile = parseInt(settings.itemsPerRowMobile);
		itemsPerRowDefault = parseInt(settings.itemsPerRowDefault);
	};

	//  Drag event handler functions
	// 	Not for touch-based inputs

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

	const handleMouseDown = (ev) => {
		isMouseDown = true;
		console.log('mouseDown event', ev)
		handleDragStart(ev)
	}
	const handleMouseUp = (ev) => {
		isMouseDown = false;
		touchDrop(ev)
	}

	// Handles touch and mouse drag item events
	const handleDragStart = (ev) => {
		// set current 'dragged item'
		dragItemName = ev.target.id

		// append a touchmove element
		ev.target.style.opacity = "0.3";
		const [x, y] = [
			ev.clientX,
			ev.clientY,
			// ev.changedTouches[0].clientX,
			// ev.changedTouches[0].clientY,
		];
		console.log("handleDragStart", ev, x, y);
		const parentElement = document.querySelector("main");
		const dragImg = document.createElement("img");
		dragImg.setAttribute("src", ev.target.src);
		dragImg.setAttribute("id", "drag-image-id");
		dragImg.setAttribute("draggable", "false");
		dragImg.addEventListener("mouseup",(ev)=>handleMouseUp(ev))
		dragImg.addEventListener("mousemove", (ev) => touchMove(ev))
		dragImg.style.width = "100px";
		dragImg.style.position = "absolute";
		dragImg.style.top = y + "px";
		dragImg.style.left = x + "px";
		// dragImg.style.border = "1px solid magenta";
		dragImg.style.transform = "translate(-50%, -50%)";
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
		console.log('touchMove event target', ev.target, 'drag item name', dragItemName)
		const dragImg = document.querySelector("#drag-image-id");
		// get current cursor location
		let x, y
		if(ev.changedTouches === undefined){
			console.log('not a touch!')
			x = ev.clientX
			y = ev.clientY
		}else{
			console.log('it is a touch')
			x = ev.changedTouches[0].clientX
			y = ev.changedTouches[0].clientY
		}
		console.log('touchmove x y', x, y)
		// handle moving drag image
		dragImg.style.top = y + "px";
		dragImg.style.left = x + "px";
		dragImg.style.transform = "translate(-50%, -50%)";

		// briefly hide dragImg
		dragImg.style.display = "none";

		// handle hover effect on targets
		const elementOver = document.elementFromPoint(x, y);
		if (elementOver?.classList.contains("drag-target")) {
			console.log("drag target touchmove over", elementOver);
			elementOver.classList.add("dropReady");
			lastElementOver = elementOver;
		} else {
			console.log("touchmove over", elementOver);
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
		console.log('drop event', ev)
		const dragImg = document.querySelector("#drag-image-id");
		let x, y
		if(ev.changedTouches === undefined){
			x = ev.clientX
			y = ev.clientY
		}else{
			x = ev.changedTouches[0].clientX
			y = ev.changedTouches[0].clientY
		}
		document.querySelector("#drag-image-id").remove();
		ev.target.style.opacity = "1";

		const dropTargetElement = document.elementFromPoint(x, y);
		console.log("untested drop target", dropTargetElement);
		if (dropTargetElement?.classList.contains("drag-target")) {
			console.log("valid drop target", dropTargetElement);
			const i = wasteStreams
				.map((stream) => stream.name)
				.indexOf(dropTargetElement.id);
			console.log('stream index', i);
			const itemIndex = wasteItems
				.map((item) => item.name)
				.indexOf(dragItemName);
			console.log('ev.target.id', ev.target.id)
			console.log('item index', itemIndex)
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
		console.log(
			"within sanitizeItems all items waste types:",
			items.map((i) => i.waste_type)
		);
		console.log(
			"items with undefined",
			items.filter((i) => i.waste_type === undefined)
		);
		return items
			.filter((item) => item.waste_type !== undefined)
			.map((item) => {
				if (
					item.image === "" ||
					item.image === "rb" ||
					item.image === undefined
				) {
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
			const indexOfRandItemOfType = arr
				.map((item) => item.name)
				.indexOf(randItemOfType.name);
			selected.push(arr.splice(indexOfRandItemOfType, 1)[0]);
		});

		let remaining = size - selected.length;
		while (remaining > 0) {
			selected.push(arr.splice(Math.random() * arr.length, 1)[0]);
			remaining -= 1;
		}
		return selected;
	};
	const addCSSToSelector = (selector, property, value) => {
		const el = document.querySelector(selector);
		el.style.setProperty(property, value);
	};
	const removeWelcome = () => {
		showWelcome = false;
	};
	onMount(async () => {
		preLoadData = await fetchPreLoad();
		console.log("initial preload", preLoadData);
		handleReset();
		document
			.querySelector(":root")
			.style.setProperty("--items-per-row-default", itemsPerRowDefault);
		document
			.querySelector(":root")
			.style.setProperty("--items-per-row-mobile", itemsPerRowMobile);
		// addCSSToSelector(':root', '--items-per-row', itemsPerRowDefault);
	});
</script>

<main>
	<header>
		<img src="./images/MZYH_logo.png" alt="Make Zero Your Hero" />
		<span>
			<h1>UMass Waste Sort Game</h1>
			{#if showReport}
				<Modal>
					<h1 slot="title">Score Report</h1>

					<ScoreReport {wasteStreams} slot="content" />

					<div slot="buttons">
						<button on:click={handleDone}>Done</button>
						<button on:click={handleReset}>Play Again</button>
					</div>
				</Modal>
			{/if}
			{#if showWelcome}
				<Modal>
					<h1 slot="title">Welcome!</h1>
					<div class="modal-slot-content" slot="content">
						{#each welcomeCopy as line}
							<p>{line}</p>
						{/each}
					</div>
					<div slot="buttons">
						<button on:click={removeWelcome}>Start the game</button>
					</div>
				</Modal>
			{/if}
		</span>
	</header>
	<section class="sort-game">
		<section class="drag-sources">
			{#each wasteItems as w, index (w.name)}
				<Item itemObj={w} {itemsPerRowDefault} {itemsPerRowMobile}>
					<img
						id={w.name}
						src={w.image}
						alt={w.name}
						draggable="false"
						on:mousedown={(ev) => handleMouseDown(ev, index)}
						on:mousemove={(ev) => {
							if(isMouseDown) touchMove(ev)
							}}
						on:dragend={(ev) => dragend(ev)}
						on:touchstart|passive={(ev) => handleDragStart(ev)}
						on:touchend={(ev) => touchDrop(ev)}
						on:touchcancel={(ev) => touchCancel(ev)}
						on:touchmove={(ev) => touchMove(ev)}
						on:mouseup={(ev) => {handleMouseUp(ev)}}
					/>
				</Item>
			{/each}
		</section>
		<section class="drag-targets">
			{#each wasteStreams as s, index (s.name)}
				<div
					class={"drag-target-container cell" + index}
					style="background-image: url('{s.image}')"
				>
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
							console.log("drag enter", event);
							s.incorrectTransitory = false;
							s.correctTransitory = false;
							s.dropReady = true;
							dragenter(event);
						}}
						on:dragover|preventDefault
						on:dragleave={(event) => {
							s.dropReady = false;
						}}
					/>
				</div>
			{/each}
		</section>
		<section class="modals">
			<!-- <Modal {content} {buttons}/> -->
		</section>
	</section>
</main>

<style>
	#testDiv {
		width: 50px;
		height: 50px;
		background-color: var(--test-var, red);
	}
	:root {
		/* Break points */
		--break-point-mobile: 768px;
		--break-point-tablet: 992px;

		/***/
		--umass-red: rgb(136, 28, 28);
		--drag-box-height-mobile: 75px;
		/* Waste Item Source Layout */
		--items-per-row: var(--items-per-row-default);
		--item-gap: 5vw;
		--drag-box-width: calc(
			(90vw - var(--item-gap) * var(--items-per-row)) /
				var(--items-per-row)
		);
		--drag-box-maxwidth: calc(
			(1024px - var(--item-gap) * var(--items-per-row)) /
				var(--items-per-row)
		);
		--drag-box-height: calc(var(--drag-box-width) * 0.75);
		--drag-box-maxheight: calc(var(--drag-box-maxwidth) * 0.75);

		/* Modal */
		--modal-margin: 30px;
		--modal-header-height: 70px;
		--modal-footer-height: 60px;
		--modal-border-radius: 30px;

		/* Waste Stream Target Layout */
		--stream-section-gap: 20px;
		--target-gap: 10px;
		--target-group-width: min(100vw, 1000px);
		--target-width: calc(
			(
					var(--target-group-width) - var(--stream-section-gap) - 7 *
						var(--target-gap)
				) / 5
		);
	}
	@media screen and (max-width: 768px) {
		:root {
			--items-per-row: var(--items-per-row-mobile);
			/* Modal */
			--modal-margin: 0px;
			--modal-header-height: 50px;
			--modal-footer-height: 50px;
			--modal-border-radius: 0px;
		}
	}

	main {
		position: relative;
		margin: 0 auto;
		height: 100%;
		width: 100%;
		/* max-width: 1024px; */
		box-sizing: border-box;
	}
	main > header {
		/* position: relative; */
		display: flex;
		flex-direction: row;
		gap: 30px;
		justify-content: flex-start;
		background-color: var(--umass-red);
		height: 75px;
		overflow: visible;
	}
	header > img {
		height: 100px;
		margin: 10px 0 0 30px;
	}
	header > span {
		padding-right: 30px;
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}
	header h1 {
		color: white;
	}
	section.sort-game {
		height: 100%;
		/* max-width: 1024px; */
		display: grid;
		grid-template-rows: 1fr calc(
				var(--target-width) / 2 + var(--target-gap) * 2
			);
		grid-template-columns: 1fr;
		place-items: start center;
		background-image: url("../images/pond_chapel_cropped.png");
		background-size: cover;
		background-position: center bottom;
		/* border: 1px solid magenta; */
		/* filter: grayscale(100%) */
	}

	.drag-sources {
		/* padding-top: 30px; */
		/* margin: 60px auto calc(var(--target-width) / 2) auto; */
		margin-top: 50px;
		max-width: 1200px;
		grid-row: 1 / 2;
		grid-column: 1 / 2;
		display: grid;
		grid-template-columns: repeat(var(--items-per-row), 1fr);
		gap: 30px;
		/* background-color: rgba(25, 0, 255, 0.315); */
	}
	section.drag-targets {
		position: absolute;
		bottom: 0px;
		grid-row: 2 / 3;
		grid-column: 1 / 2;
	}
	/* Drag Target Layout */
	.drag-targets {
		/* width: 100%; */
		max-width: 1200px;
		display: grid;
		grid-template-areas: "cell0 cell1 cell2 . cell3 cell4";
		grid-template-columns:
			repeat(3, var(--target-width)) var(--stream-section-gap)
			repeat(2, var(--target-width));
		grid-template-rows: 1fr;
		gap: var(--target-gap);
		padding: var(--target-gap);
	}
	.cell0 {
		grid-area: cell0;
	}
	.cell1 {
		grid-area: cell1;
	}
	.cell2 {
		grid-area: cell2;
	}
	.cell3 {
		grid-area: cell3;
	}
	.cell4 {
		grid-area: cell4;
	}

	.drag-target-container {
		width: var(--target-width);
		height: calc(var(--target-width) / 2);
		background-size: cover;
		background-position: center;
		border-radius: 10px;
		box-shadow: 0 0 20px 5px black;
	}
	.drag-target {
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.01);
		box-sizing: border-box;
		border-radius: 10px;
	}

	.drag-target.dropReady {
		color: white;
		background-color: rgba(255, 255, 255, 0.6);
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
		width: 500px;
	}

	@keyframes flashRed {
		from {
			background-color: transparent;
		}
		10% {
			background-color: red;
			box-shadow: 0 0 50px 5px red;
		}
		to {
			background-color: transparent;
		}
	}
	@keyframes flashGreen {
		from {
			background-color: transparent;
		}
		10% {
			background-color: green;
			box-shadow: 0 0 50px 5px green;
		}
		to {
			background-color: transparent;
		}
	}
	@media only screen and (max-width: 768px) {
		.drag-targets {
			gap: 0;
			padding: 0;
			background-color: rgba(0, 0, 0, 0.7);
			grid-template-areas: " cell0 cell1 cell2 . cell3 cell4";
			grid-template-rows: 1fr;
			grid-template-columns: repeat(3, 1fr) 20px repeat(2, 1fr);
			box-shadow: 0 0 10px 1px black;
		}
		.drag-target-container,
		.drag-target {
			box-shadow: none;
			border-radius: 0;
			width: calc((100vw - 20px) / 5);
			height: calc((100vw - 20px) / 10);
		}
	}
	@media screen and (max-width: 768px) {
		:root {
			--drag-box-height: 75px;
		}
		main header h1 {
			font-size: 1.5em;
		}
		main > header > span {
			padding: 0;
		}
		main > header > img {
			margin: 10px 0 0 10px;
			height: 75px;
		}

		.drag-targets {
			gap: 0;
			padding: 0;
			background-color: rgba(0, 0, 0, 0.9);
			grid-template-areas:
				" cell0 cell0 cell1 cell1 cell2 cell2"
				" .     cell3 cell3 cell4 cell4 .    ";
			grid-template-rows: 1fr 1fr;
			grid-template-columns: repeat(6, 1fr);
			box-shadow: 0 0 10px 1px black;
		}
		.drag-target-container,
		.drag-target {
			box-shadow: none;
			border-radius: 0;
			width: calc(100vw / 3);
			height: calc(100vw / 6);
		}
	}
</style>
