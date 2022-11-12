import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Collapse from '@mui/material/Collapse';
import { useEffect, useMemo, useRef, useState } from 'react';
// import { Button, ButtonGroup, Typography } from '@mui/material';
import ButtonGroup from '@mui/material/ButtonGroup';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Sieve from './sieve';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';

/** Used for events */
const e = document.createElement("div");

class MySieve extends Sieve {
  protected onFiltering(n: bigint) {
    e.dispatchEvent(new CustomEvent("filtering", {detail: n}))
  }
  protected onNotPrime(p: bigint) {
    // console.log(p, "not prime");
    e.dispatchEvent(new CustomEvent("notprime", {detail: p}))
  }
  protected onPrime(p: bigint) {
    // console.log(p, "prime");
    e.dispatchEvent(new CustomEvent("prime", {detail: p}))
  }
}
const s = new MySieve();

function Number({n, prime}: {n: bigint; prime?: boolean}) {

  return <Avatar sx={{ bgcolor: prime ? "black" : prime === false ? "lightgrey" : "transparent", color: prime === undefined ? "black" : undefined }} variant="rounded">
    {n.toString()}
  </Avatar>
}

function App() {
  const [info, setInfo] = useState(true);
  const [playing, setPlaying] = useState(false);
  const initSpeed = 10
  const speed = useRef(initSpeed);
  const [current, setCurrent] = useState<bigint>(BigInt(1));
  const [showCurrent, setShowCurrent] = useState(true);
  const [primesOnly, setPrimesOnly] = useState(false);
  const [numbers, setNumbers] = useState<{v: bigint, prime?: boolean;}[]>([]);

  useEffect(() => {
    let i: number = -1;
    const next = () => {
      s.filterNext();
      i = window.setTimeout(next, Math.max(0, 400 - speed.current * 4))
    }

    if (playing) next();

    return () => {
      if (playing) clearTimeout(i);
    }
  }, [playing]);

  useEffect(() => {
    const isValidEvent = (e: Event): e is CustomEvent<bigint> => e instanceof CustomEvent && typeof e.detail === "bigint"

    const updateFiltering = (e: Event) => {if (isValidEvent(e)) setCurrent(e.detail);}
    e.addEventListener("filtering", updateFiltering);

    const updateNotPrime = (e: Event) => {if (isValidEvent(e) && !primesOnly) setNumbers(n => [...n, {v: e.detail, prime: false}]);}
    e.addEventListener("notprime", updateNotPrime);

    const updatePrime = (e: Event) => {if (isValidEvent(e)) setNumbers(n => [...n, {v: e.detail, prime: true}]);}
    e.addEventListener("prime", updatePrime);

    return () => {
      e.removeEventListener("filtering", updateFiltering);
      e.removeEventListener("notprime", updateNotPrime);
      e.removeEventListener("prime", updatePrime);
    }
  }, [primesOnly]);

  useEffect(() => {
    if (primesOnly) {
      setNumbers(s.getPrimes().map(p => ({v: p, prime: true})));
    } else {
      let n = BigInt(2);
      const p = s.getPrimes();
      const newNumbers: {v: bigint, prime?: boolean;}[] = []
      for (const prime of p) {
        if (n === prime) {
          newNumbers.push({v: prime, prime: true});
        } else {
          for (let v = n; v < prime; v++) {
            newNumbers.push({v, prime: false});
          }
          newNumbers.push({v: prime, prime: true});
          n = prime
        }
        n++;
      }
      if (current) for (let v = n; v <= current; v++) {
        newNumbers.push({v, prime: false});
      }
      setNumbers(newNumbers)
    }
    // eslint-disable-next-line
  }, [primesOnly]);

  const nums = useMemo(() => numbers.map(n => <Number key={n.v.toString()} n={n.v} prime={n.prime} />), [numbers]);

  const handleNext = () => {
    s.filterNext();
    setPlaying(false);
  }

  return (
    <div style={{
      textAlign: "center",
      display: "grid",
      position: "absolute",
      left: 8,
      right: 8,
      top: 8,
      bottom: 8,
      gridTemplateRows: "auto auto auto 1fr"
    }}>
      <Typography variant="h1">Sieve of Eratosthenes</Typography>
      <div style={{textAlign: "start"}}>
        <Collapse in={info}>
          <Alert severity="info" onClose={() => setInfo(false)}>
            <AlertTitle>Explanation</AlertTitle>
            An algorithm for finding prime numbers. We iterate all numbers starting with two. Two is prime. Any subsequent number is prime if it cannot be divided by any of the previous primes found.
          </Alert>
        </Collapse>
      </div>
      <div
        style={{
          display: "grid",
          alignItems: "center",
          gridTemplateColumns: "1fr auto 1fr",
          margin: 20,
          gap: 12
        }}
      >
        <Button onClick={() => {setPrimesOnly(p => !p)}}>{primesOnly ? "Showing primes only" : "Showing all"}</Button>
        <ButtonGroup variant="contained" aria-label="outlined primary button group">
          <Button onClick={() => setPlaying(true)} disabled={playing}><PlayArrowIcon /></Button>
          <Button onClick={handleNext}><SkipNextIcon /></Button>
          <Button onClick={() => setPlaying(false)} disabled={!playing} color='error'><PauseIcon /></Button>
        </ButtonGroup>
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr"}}>
          <Button onClick={() => setShowCurrent(p => !p)}>{showCurrent ? "Current processed number: " + current?.toString() : "Show current processed number"}</Button>
          <Stack spacing={2} direction="row" alignItems="center">
            <Typography>Speed</Typography>
            <Slider defaultValue={initSpeed} onChange={(_, v) => typeof v === "number" ? speed.current = v : undefined} />
          </Stack>
        </div>
      </div>
      <Card sx={{overflow: "auto"}}>
        <CardContent>
          <div style={{
            display: "flex",
            gap: 15,
            flexWrap: "wrap"
          }}>
            <Number n={BigInt(1)} />
            {nums}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
