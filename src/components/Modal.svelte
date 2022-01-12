<script>
	// export let modalCopy;
	// export let modalButtons;
	// export let visible;
	// console.log(modalCopy)
</script>

<div class="modal-background">
	<div class="modal-container">
		<header>
			<img src="./images/MZYH_logo.png" alt="Make Zero Your Hero">
			<span>
				<slot name="title"/>
			</span>
		</header>
		
		<section class="modal-body">
			<div class="modal-content">
				<slot name="content"/>
			</div>
			<div class="modal-buttons">
				<slot name="buttons"/>
			</div>
		</section>
	</div>
</div>

<style>
	.modal-background {
		position: absolute;
		left: 0;
		top: 0;
		z-index: 10;
		width: 100%;
		height: 100%;
		background-color: rgba(0,0,0,.8);
		display: flex;
		justify-content: center;
		align-items: center;
		
	}
	header {
		position: relative;
		display: flex;
		flex-direction: row;
		gap: 30px;
		align-items: center;
		justify-content: center;
		background-color: var(--umass-red);

		height: var(--modal-header-height);
		overflow: visible;
		border-radius: var(--modal-border-radius) var(--modal-border-radius) 0 0;
	}
	header > img {
		height: 100px;
		position: absolute;
		/* margin: 10px 0 0 30px; */
		left: 30px;
		top: 10px;
	}
	header > span{
		padding-right: 30px;
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: center;
	}

	.modal-container {
		background-color: none;
		width: calc(100vw - 2 * var(--modal-margin));
		max-width: 1000px;
		/* height: 100px; */
		height	: calc(100vh - 2 * var(--modal-margin));
		max-height: calc( 100% - 2 * var(--modal-margin));
		/* margin: var(--modal-margin); */
		border-radius: var(--modal-border-radius);
		/* overflow-y: scroll; */
		display: flex;
		flex-direction: column;
	}
	
	.modal-body{
		/* height: 100%; */
		/* display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center; */
		display: grid;
		grid-template-rows: 1fr calc(2 * var(--modal-header-height));
		background-color: white;
		padding-left: var(--modal-margin);
		padding-right: var(--modal-margin);
		/* overflow-y: scroll; */

	}
	.modal-body:last-of-type{
		border-radius: 0 0 var(--modal-border-radius) var(--modal-border-radius);
	}
	.modal-content{
		font-size: 1.5rem;
		width: 100%;
		height: 100%;
		max-height: calc(100vh - 2 * var(--modal-margin) - 3.5 * var(--modal-header-height));
		overflow-y: auto;
		padding-top: 40px;
		/* background-color: aqua; */

	}

	.modal-buttons{
		width: 100%;
		height: 100%;
		/* background-color: blanchedalmond; */
		display: grid;
		place-items: center;
		padding: none;
		
	}
	.modal-buttons :global(div) {
		/* background-color: aquamarine; */
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 10px 10px 0 10px;
		gap: 10px;
		
	}
	.modal-buttons :global(button){
		font-size: 2rem;
		font-weight: bold;
		color: white;
		background-color: var(--umass-red);
		width: 100%;
		border-radius: calc(var(--modal-border-radius) / 2);
		
	}	
</style>