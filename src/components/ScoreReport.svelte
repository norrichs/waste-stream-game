<script>
	export let wasteStreams
	// export let hiddenScoreReport
	// export let handleReset
	
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
	

<div class="score-report">
	<h3>correct answers: {sortScore}</h3>
	<div class="report-grid">
		{#each wasteStreams as s}
			<!-- <h4>{s.name}</h4> -->
			<div class="row">
				<img class="report-label" src={s.image} alt={s.name}>
				<ul>
					{#each s.items as item}
						<li
							class={item.waste_type.includes(s.waste_type)
								? "correct"
								: "incorrect"}
						>
							<h4>{item.name}</h4>
							<p>{item.waste_type.includes(s.waste_type)
									? item.correct
									: item.incorrect}
							</p>
						</li>
				
					{/each}
				</ul>
			</div>
		{/each}
	</div>
</div>


<style>
	h4{
		margin: 0 0 0 10px;
	}
	.report-grid .row ul {
		margin: none;
		margin-block-start: 0;
		margin-block-end: 0;
	}
	.score-report{
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		overflow-y: scroll;
	}
	.report-grid{
		display: flex;
		flex-direction: column;
	}
	.row{
		display: grid;
		grid-template-columns: 200px 1fr;
		padding: 5px 0;
		border-bottom: 3px solid gray
	}
	.row:last-of-type{
		border-bottom: none;
	}
	.report-label{
		max-width: 190px;
	}
	.correct,
	.incorrect {
		padding: 5px;
		border-radius: 5px;
		border: 1px solid;
		margin: 3px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}
	.correct>p,
	.incorrect>p {
		font-size: 1rem;
		font-weight: 200;
		margin-left: 10px;
	}
	.correct>h4,
	.incorrect>h4 {
		font-size: 1rem;
		font-weight: 700;
	}
	.correct {
		color: green;
		background-color: lightgreen;
	}
	.incorrect {
		color: red;
		background-color: lightpink;
	}

	@media screen and (max-width: 400px) {
		.report-label {
			width: 90px;
		}
		.row{
			display: grid;
			grid-template-columns: auto auto;
		}
		.row ul {
			padding-inline-start: 0;
		}
	}


</style>