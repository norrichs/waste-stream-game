<script>
	export let itemObj

</script>

<div class="waste-item-container">
	<header>{itemObj.name}</header>
	<div class="waste-item-box">
		<slot></slot>
	</div>
</div>




<style>
	.waste-item-container{
		width: 125px;
		height: 125px;
		overflow: visible;
		border-radius: 10px 10px 5px 5px;
		background-color: rgba(255, 200, 200, 0.1);
		backdrop-filter: blur(5px);
		box-shadow: 0 0 20px 0px black;
		/* border: 1px solid magenta; */
	}
	.waste-item-container header{
		color: white;
		padding: 10px;
		border-radius: 5px 5px 0 0;
		background-color: var(--umass-red);
		margin: 0;
	}
	.waste-item-box{
		
		/* border: 1px solid black; */
		padding: 0;
		width: 100%;
		display: grid;
		place-items: center;
		position: relative;
		/* background-color: red; */


	}

	.waste-item-box :global(img) {
		width: 75px;
		top: 0;
		left: calc((125px - 75px) / 2);
		position: absolute;
	}
</style>