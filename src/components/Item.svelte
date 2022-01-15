<script>
	export let itemObj
	export let itemsPerRowDefault;
	export let itemsPerRowMobile;

	// console.debug('item props', itemObj, itemsPerRowDefault, itemsPerRowMobile)

</script>

<div class="waste-item-container">
	<header>{itemObj.name}</header>
	<div class="waste-item-box">
		<slot></slot>
	</div>
</div>




<style>
	.waste-item-container{
		width: var(--drag-box-width);
		max-width: var(--drag-box-maxwidth);
		height: var(--drag-box-height);
		max-width: var(--drag-box-maxheight);
		max-height: var(--drag-box-max-height);
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
		padding: 0;
		width: 100%;
		position: relative;
	}

	.waste-item-box :global(img) {
		max-height: var(--drag-box-height);
		max-width: var(--drag-box-width);
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translateX(-50%);
		/* border: 1px dotted black; */
	}
	@media only screen and (max-width: 768px){
		.waste-item-container header {
			font-size: 0.75em;
		}
	}
</style>