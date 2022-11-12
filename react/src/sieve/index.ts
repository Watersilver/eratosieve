// A concurrent sieve
abstract class Sieve {
  private primes: bigint[] = [];
  private current: bigint = BigInt(1);

  filterNext() {
    this.current++;
    this.onFiltering(this.current);

    for (const prime of this.primes) {
      if (this.current % prime === BigInt(0)) {
        this.onNotPrime(this.current);
        return
      }
    }

    this.primes.push(this.current)
    this.onPrime(this.current);
  }

  protected abstract onFiltering(n: bigint): any;
  protected abstract onPrime(p: bigint): any;
  protected abstract onNotPrime(p: bigint): any;

  getPrimes(): readonly bigint[] {return this.primes;}
}

export default Sieve