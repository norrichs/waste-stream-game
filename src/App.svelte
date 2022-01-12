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
	let showReport = false;
	let showWelcome = true;
	let showCertificate = false;
	let welcomeCopy = []

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
				.classList.remove("stop-scrolling")


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
		showCertificate = true
	}

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
	const parseParagraph = (str) => {
		console.log('PARSING', str)
		const arr = str.split("\n")
		console.log('paragraph ->',arr)
		return arr
	}
	const handleSettings = (settings) => {
		wasteItemsCount = parseInt(settings.wasteItemsCount);
		adminMode = settings.adminMode;
		console.log('handle settings welcome copy', settings.welcomeText)
		welcomeCopy = parseParagraph(settings.welcomeText)
		itemsPerRowMobile = parseInt(settings.itemsPerRowMobile);
		itemsPerRowDefault = parseInt(settings.itemsPerRowDefault);
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
	const addCSSToRoot = () => {
		const root = document.querySelector(":root");
		console.log("root", root);
		root.style.setProperty("--test-var", "blue");
	};
	const removeWelcome = () => {
		showWelcome = false;
	};
	onMount(async () => {
		preLoadData = await fetchPreLoad();
		console.log("initial preload", preLoadData);
		handleReset();
		addCSSToRoot();
	});

</script>

<main>
	<header>
		<img src="./images/MZYH_logo.png" alt="Make Zero Your Hero" />
		<span>
			<h1>UMass Waste Sort Game</h1>
			<!-- <ScoreReport {wasteStreams} {hiddenScoreReport} {handleReset} /> -->
			{#if showReport}
				<Modal>
					<h1 slot="title">Score Report</h1>
					
						<ScoreReport {wasteStreams} slot="content"/>
				
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
						draggable="true"
						on:dragstart={(ev) => dragstart(ev, index)}
						on:dragend={(ev) => dragend(ev)}
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
		--umass-red: rgb(136, 28, 28);
		--drag-box-height-mobile: 75px;
		/* Waste Item Source Layout */
		--items-per-row: 3;
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
		--target-width: calc(
			(100vw - var(--stream-section-gap) - 7 * var(--target-gap)) / 5
		);
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
		/* position: absolute; */
		margin: 10px 0 0 30px;
		left: 30px;
		top: 10px;
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
		background-image: url("../images/pond_chapel_cropped.png");
		background-size: cover;
		background-position: center bottom;
		/* border: 1px solid magenta; */
		/* filter: grayscale(100%) */
	}

	.drag-sources {
		/* padding-top: 30px; */
		margin: 60px auto calc(var(--target-width) / 2) auto;
		max-width: 1000px;
		grid-row: 1 / 2;
		grid-column: 1 / 2;

		display: grid;
		grid-template-columns: repeat(var(--items-per-row), 1fr);

		/* display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: flex-start;
		flex-wrap: wrap; */
		/* padding: 60px 0px; */
		gap: 30px;
	}
	section.drag-targets {
		position: absolute;
		bottom: 0px;
		grid-row: 2 / 3;
		grid-column: 1 / 2;
	}
	/* Drag Target Layout */
	.drag-targets {
		width: 100%;
		display: grid;
		grid-template-areas: "cell0 cell1 cell2 . cell3 cell4";
		grid-template-columns: repeat(3, var(--target-width)) var(
				--stream-section-gap
			) repeat(2, var(--target-width));
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
	@media screen and (max-width: 800px) {
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
	@media screen and (max-width: 400px) {
		:root {
			--drag-box-height: 75px;
		}
		main > header {
			background-color: var(--umass-red);
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
