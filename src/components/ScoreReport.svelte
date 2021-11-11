<script>
	export let wasteStreams
	export let hiddenScoreReport
	
	
	


	// Score calcuating function.  Adds 1 to score if waste type of
	// 	stream chosen is included in waste types of item dragged (sometimes multiple correct possible)
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
		// Reactive score variable declaration.  Will recalculate whenever wasteStreams changes,
	//		triggering re-render
	let sortScore;
	$: {
		sortScore = calcScore(wasteStreams)
	}

</script>
	

<h2>Score: {sortScore}</h2>

<section class="score-report-container" class:hiddenScoreReport={hiddenScoreReport}>
	<div class="score-report">
		<h2>Report:</h2>
		<h3>correct answers: {sortScore}</h3>
		<div class="report-grid">
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
		</div>
		<button class="reset-button" on:click={()=>{
			console.log('reset')
			location.reload()
		}}>Reset</button>
	</div>
</section>

<style>
	button.reset-button{
		width: 75%;
		margin: 30px auto;
	}
	h4{
		margin: 0 0 0 30px;
	}
	ul{
		margin: 0 0 20px 0;
	}
	.hiddenScoreReport{
		visibility: hidden;
	}
	.score-report-container {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: -100%;
		height: 100%; 
		background-color: rgba(0,0,0,.7);
		display: grid;
		place-items: center;
	}
	.score-report{
		padding: 30px;
		background-color: aliceblue;
		margin: 0 auto;
		max-width: 800px;
		display: flex;
		flex-direction: column;
		border-radius: 20px;
	}
	.report-grid{
		display: grid;
		grid-template-columns: 1fr 5fr;

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
</style>