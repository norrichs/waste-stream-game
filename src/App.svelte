<script>
	import { flip } from "svelte/animate";
	import { quintOut } from "svelte/easing";

	let wasteStreams = [
		{
			name: "Recycle",
			waste_type: "recyclable",
			dropReady: false,
			incorrectTransitory: false,
			items: [],
		},
		{
			name: "Compost",
			waste_type: "compostable",
			dropReady: false,
			incorrectTransitory: false,
			items: [],
		},
		{
			name: "Reuse",
			waste_type: "reusable",
			dropReady: false,
			incorrectTransitory: false,
			items: [],
		},
		{
			name: "Landfill",
			waste_type: "landfill",
			dropReady: false,
			incorrectTransitory: false,
			items: [],
		},
	];
	let wasteItems = [
		{
			name: "Soda can",
			waste_type: "recyclable",
			image: "./images/soda_can.png",
			incorrect: "Aluminum soda cans are very recyclable",
			correct: "",
		},
		{
			name: "Paper bag",
			waste_type: "reusable",
			image: "./images/paper_bag.png",
			incorrect: "Go ahead and reuse a few times before recycling!",
			correct: "might as well reuse...",
		},
		{
			name: "Paper cup",
			waste_type: "recyclable",
			image: "./images/paper_cup.png",
			incorrect: "recycle this plz!",
			correct: "nicely recycled into new paper products!",
		},
		{
			name: "Rotten apple",
			waste_type: "compostable",
			image: "./images/rotten_apple.png",
			incorrect:
				"Best to compost at home if you can.  Improves soil health!",
			correct: "Yep, compost it!",
		},
		{
			name: "Tire",
			waste_type: "landfill",
			image: "./images/tire.png",
			incorrect: "Just dump it!",
			correct: "Your local transfer station will know what to do",
		},
	];

	const dragstart = (e, i) => {
		console.log("dragstart()", i, e.target);
		// let dragImg = e.srcElement
		e.dataTransfer.setData("text/plain", wasteItems[i].name);
		const dragImg = document.getElementById(e.target.id);
		e.target.style.opacity = 0.1;
		e.dataTransfer.setDragImage(dragImg, 50, 50);
		// console.log('post set', e)
		// e.currentTarget.style.opacity = "100%"
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
		console.log("recalc");
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
						dragenter(event);
					}}
					on:dragover|preventDefault={(event) => {
						console.log("dragover()");
						s.dropReady = true;
					}}
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
		<div>Score: {sortScore}</div>
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
	div.drag-target.incorrectTransitory {
		background-color: red;
		transition: 200ms;
	}
	div.drag-target.correctTransitory {
		background-color: green;
		transition: 200ms;
	}
</style>
