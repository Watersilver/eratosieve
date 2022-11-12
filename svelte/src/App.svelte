<script lang="ts">
  import Sieve from "./sieve";
  import { slide } from 'svelte/transition';
  import { onMount } from "svelte";
  import { cubicInOut } from 'svelte/easing';

  function appear(node: HTMLElement, params?: any) {
    const initRot = Math.random() * 2.6 - 1.3;
    return {
      delay: params.delay,
      duration: params.duration || 400,
      easing: cubicInOut,
      css: (t: number, u: number) => `transform: scale(${t}) rotate(${initRot * u}turn)`
    }
  }

  function squeeze(node: HTMLElement, params?: any) {
    const s = getComputedStyle(node);
    const w = parseFloat(s.width);
    const h = parseFloat(s.height);
    const m = parseFloat(s.margin);
    return {
      delay: params.delay,
      duration: params.duration || 200,
      easing: cubicInOut,
      css: (t: number) => `width: ${w * t}px; height: ${h * t}px; margin: ${m * t}px;`
    }
  }

  function transin(node: HTMLElement, params: any) {
    if (params.squeezed === true) {
      return squeeze(node, params);
    } else {
      return appear(node, params);
    }
  }

  function disappear(node: HTMLElement, params?: any): {
    delay?: number,
    duration?: number,
    easing?: (t: number) => number,
    css?: (t: number, u: number) => string,
    tick?: (t: number, u: number) => void
  } {
		const s = getComputedStyle(node);
    const w = parseFloat(s.width);
    const h = parseFloat(s.height);
    const m = parseFloat(s.margin);

    return {
      delay: params.delay,
      duration: params.duration || 200,
      easing: cubicInOut,
      css: t => `width: ${t * w}px; height: ${t * h}px; margin: ${t * m}px;`
    };
  }

  function createRipple(event: MouseEvent) {
    const button: any = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - (button.offsetLeft + radius)}px`;
    circle.style.top = `${event.clientY - (button.offsetTop + radius)}px`;
    circle.classList.add("ripple");
    button.appendChild(circle);

    circle.onanimationend = () => circle.remove();
  }
  onMount(() => {
    // Ripples for all (ripple-)buttons!
    const buttons = document.getElementsByClassName("ripple-button");
    for (const button of buttons) {
      button.addEventListener("click", createRipple);
    }
  });

  let numbers: {v: bigint; prime?: boolean; paused?: boolean; squeezed?: boolean;}[] = [];
  let current = 1n;
  let wiggling = true;
  class MySieve extends Sieve {
    protected onFiltering(n: bigint) {current = n;}
    protected onNotPrime(n: bigint) {
      if (!primesOnly) numbers.push({v: n});
      numbers = numbers;
    }
    protected onPrime(p: bigint) {
      numbers.push({v: p, prime: true, paused: !wiggling});
      numbers = numbers;
    }
  }
  const s = new MySieve();

  let collapse = false;
  function collapseExplanation(e: Event) {
    if (collapse) return;
    collapse = true;
  }

  var primesOnly = false;
  function onClickShowMode() {
    primesOnly = !primesOnly;
    if (primesOnly) {
      numbers = s.getPrimes().map(p => ({v: p, prime: true}));
    } else {
      let n = BigInt(2);
      const p = s.getPrimes();
      const newNumbers: typeof numbers = []
      for (const prime of p) {
        if (n === prime) {
          newNumbers.push({v: prime, prime: true, paused: !wiggling});
        } else {
          for (let v = n; v < prime; v++) {
            newNumbers.push({v, prime: false, squeezed: true});
          }
          newNumbers.push({v: prime, prime: true, paused: !wiggling});
          n = prime
        }
        n++;
      }
      if (current) for (let v = n; v <= current; v++) {
        newNumbers.push({v, prime: false});
      }
      numbers = newNumbers;
    }
  }

  function toggleWiggling() {
    wiggling = !wiggling;
    numbers = numbers.map(n => {
      if (!n.prime) return n;
      return {...n, paused: !wiggling};
    })
  }

  let t: number | null = null;
  let speed = 10;
  let generating = false;
  function onClickGo() {
    generating = true;
  }
  function onClickNext() {
    generating = false;
    s.filterNext();
  }
  function onClickPause() {
    generating = false;
  }
  $: if (generating) {
    if (!t) {
      const next = () => {s.filterNext(); t = window.setTimeout(next, 400 - speed * 4)};
      next();
    }
  } else {
    if (t) window.clearInterval(t);
    t = null;
  }

  let showCurrent = true;
  function onClickShowCurrent() {
    showCurrent = !showCurrent;
  }
</script>

<main>
  <h1>Sieve of Eratosthenes</h1>
  <div>
    {#if !collapse}
      <div class="collapser" out:slide>
        <section id="explanation">
          <div class="alert-icon"><svg class="svg-icon-root" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="InfoOutlinedIcon"><path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20, 12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10, 10 0 0,0 12,2M11,17H13V11H11V17Z"></path></svg></div>
          <div class="alert-msg"><div class="alert-title">Explanation</div>An algorithm for finding prime numbers. We iterate all numbers starting with two. Two is prime. Any subsequent number is prime if it cannot be divided by any of the previous primes found.</div>
          <div class="alert-action"><button on:click={collapseExplanation} class="close-button-root" tabindex="0" type="button" aria-label="Close" title="Close"><svg class="svg-icon-root small" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CloseIcon"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg></button></div>
        </section>
      </div>
    {/if}
  </div>
  <div id="tools">
    <div style="display: grid; grid-template-columns: 1fr 1fr;">
      <button on:click={onClickShowMode} class="ripple-button">{primesOnly ? "Showing primes only" : "Showing all"}</button>
      <button on:click={toggleWiggling} class="ripple-button">Wiggling: {wiggling ? "on" : "off"}</button>
    </div>
    <div class="button-group">
      <button disabled={generating} id="go" on:click={onClickGo} class="ripple-button">
        <svg class="svg-icon-root medium" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="PlayArrowIcon"><path d="M8 5v14l11-7z"></path></svg>
      </button>
      <button on:click={onClickNext} class="ripple-button">
        <svg class="svg-icon-root medium" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="SkipNextIcon"><path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z"></path></svg>
      </button>
      <button disabled={!generating} id="pause" on:click={onClickPause} class="ripple-button red">
        <svg class="svg-icon-root medium" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="PauseIcon"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
      </button>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr;">
      <button id="current" on:click={onClickShowCurrent} class="ripple-button">{showCurrent ? `Current processed number: ${current}` : "Show current processed number"}</button>
      <div style="display: grid; gap: 16px; grid-template-columns: auto 1fr; justify-items: stretch; align-items: center;">
        <label for="speed">Speed</label>
        <input type="range" id="speed" min="0" max="100" bind:value={speed}>
      </div>
    </div>
  </div>
  <section id="board">
    <div class="number">1</div>
    {#each numbers as { v, prime, paused, squeezed } (v)}
      <div in:transin={{squeezed}} out:disappear class="number{prime ? " prime" : " not-prime"}{paused ? " paused" : ""}">{v}</div>
    {/each}
  </section>
</main>

<style>
  :root {
    margin: 0;
    font-family: 'Roboto', sans-serif;
  }

  main {
    text-align: center;
    display: grid;
    position: absolute;
    left: 8px;
    right: 8px;
    top: 8px;
    bottom: 8px;
    grid-template-rows: auto auto auto 1fr;
  }

  h1 {
    margin: 0;
    font-family: "Roboto","Helvetica","Arial",sans-serif;
    font-weight: 300;
    font-size: 6rem;
    line-height: 1.167;
    letter-spacing: -0.01562em;
  }

  #explanation {
    transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    border-radius: 4px;
    box-shadow: none;
    font-family: "Roboto","Helvetica","Arial", sans-serif;
    font-weight: 400;
    font-size: 0.875rem;
    line-height: 1.43;
    letter-spacing: 0.01071em;
    background-color: rgb(229, 246, 253);
    display: flex;
    padding: 6px 16px;
    color: rgb(1, 67, 97);
    text-align: start;
  }

  .alert-icon {
    color: #03a9f4;
    margin-right: 12px;
    padding: 7px 0;
    display: flex;
    font-size: 22px;
    opacity: 0.9;
  }

  .svg-icon-root {
    user-select: none;
    width: 1em;
    height: 1em;
    display: inline-block;
    fill: currentColor;
    flex-shrink: 0;
    transition: fill 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    font-size: inherit;
  }

  .svg-icon-root.small {
    font-size: 1.25rem;
  }

  .svg-icon-root.medium {
    font-size: 1.5rem;
  }

  .alert-msg {
    padding: 8px 0;
    min-width: 0;
    overflow: auto;
  }

  .alert-title {
    margin: 0;
    font-family: "Roboto","Helvetica","Arial",sans-serif;
    font-weight: 400;
    font-size: 1rem;
    line-height: 1.5;
    letter-spacing: 0.00938em;
    margin-bottom: 0.35em;
    font-weight: 500;
    margin-top: -2px;
  }

  .alert-action {
    display: flex;
    align-items: flex-start;
    padding: 4px 0 0 16px;
    margin-left: auto;
    margin-right: -8px;
  }

  .close-button-root {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
    background-color: transparent;
    outline: 0;
    border: 0;
    margin: 0;
    border-radius: 0;
    padding: 0;
    cursor: pointer;
    user-select: none;
    vertical-align: middle;
    appearance: none;
    text-decoration: none;
    color: inherit;
    text-align: center;
    flex: 0 0 auto;
    font-size: 1.5rem;
    padding: 8px;
    border-radius: 50%;
    overflow: visible;
    color: rgba(0, 0, 0, 0.54);
    transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    color: inherit;
    padding: 5px;
    font-size: 1.125rem;
  }

  .collapser {
    height: auto;
    overflow: visible;
    transition: height 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  }

  #tools {
    display: grid;
    align-items: center;
    grid-template-columns: 1fr auto 1fr;
    margin: 20px;
    gap: 12px;
  }

  .ripple-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
    background-color: transparent;
    outline: 0;
    border: 0;
    margin: 0;
    border-radius: 0;
    padding: 0;
    cursor: pointer;
    user-select: none;
    vertical-align: middle;
    appearance: none;
    text-decoration: none;
    color: inherit;
    font-family: "Roboto","Helvetica","Arial",sans-serif;
    font-weight: 500;
    font-size: 0.875rem;
    line-height: 1.75;
    letter-spacing: 0.02857em;
    text-transform: uppercase;
    padding: 6px 8px;
    border-radius: 4px;
    transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    color: #1976d2;

    position: relative;
    overflow: hidden;
    --ripple-col: #1976d231;
  }
  .ripple-button:hover {
    background-color: #1976d20a;
  }

  .button-group {
    display: inline-flex;
    overflow: hidden;
    border-radius: 4px;
    box-shadow: 0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12);
  }
  .button-group>.ripple-button {
    border-radius: 0;
    border-right: 1px solid #0001;
    color: #fff;
    background-color: #1976d2;
    padding: 6px 16px;
    --ripple-col: #ffffff31;
  }
  .button-group>.ripple-button:hover {
    background-color: #0b5aa8;
  }
  .button-group>.ripple-button.red {
    background-color: #d32f2f;
  }
  .button-group>.ripple-button.red:hover {
    background-color: #9e1c1c;
  }
  .button-group>.ripple-button:last-child {
    border-right: 0;
  }
  .button-group>.ripple-button:disabled, .button-group>.ripple-button.red:disabled {
    background-color: gainsboro;
    color: darkgray;
    cursor: auto;
  }

  #board {
    overflow: auto;
    color: rgba(0, 0, 0, 0.87);
    transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    border-radius: 4px;
    box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12);
    overflow: auto;
    padding: 8.5px;

    display: flex;
    align-content: start;
    align-items: center;
    flex-wrap: wrap;
  }

  .number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    justify-items: center;
    align-items: center;
    overflow: hidden;
    font-size: 1.25rem;
    user-select: none;
    margin: 7.5px;
  }

  .number:not(.prime):not(.not-prime) {
    animation: none;
  }

  .number.prime {
    background-color: red;
    color: white;

    animation: 500ms ease-in-out forwards wiggle-start,
    1s ease-in-out 500ms infinite alternate wiggle;
  }
  @keyframes wiggle-start {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(20deg);
    }
  }
  @keyframes wiggle {
    from {
      transform: rotate(20deg);
    }
    to {
      transform: rotate(-20deg);
    }
  }

  .number.prime.paused {
    animation-play-state:paused !important;
  }

  .number.not-prime {
    background-color: antiquewhite;
  }
</style>