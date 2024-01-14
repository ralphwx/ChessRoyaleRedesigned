
/**
 * This class collects data on server/client request send/receive times and 
 * attempts to estimate the client time minus server time.
 */
class LagEstimator {
  constructor() {
    //these parameters estimate local clock minus server clock.
    this.min = null;
    this.max = null;
  }
  /**
   * Records a timing transaction. Requires meta to have properties:
   *   [clientSendTime]
   *   [serverReceiveTime]
   *   [serverSendTime]
   *   [clientReceiveTime]
   */
  record(meta) {
    let new_min = meta.clientSendTime - meta.serverReceiveTime;
    if(this.min === null || (new_min > this.min && !isNaN(new_min))) {
      this.min = new_min;
    }
    let new_max = meta.clientReceiveTime - meta.serverSendTime;
    if(this.max === null || (new_max < this.max && !isNaN(new_max))) {
      this.max = new_max;
    }
  }
  /**
   * Returns an upper bound on the estimate of the clock difference between 
   * client and server. If no data is yet available, error is thrown.
   */
  get_max() {
    if(this.min === null || this.max === null) {
      throw new Error("Cannot fetch lag estimate without data");
    }
    return Math.max(this.min, this.max);
  }
  /**
   * Returns a lower bound on the estimate of the clock difference between
   * client and server. If no data is yet available, error is thrown.
   */
  get_min() {
    if(this.min === null || this.max === null) {
      throw new Error("Cannot fetch lag estimate without data");
    }
    return Math.min(this.min, this.max);
  }
  /**
   * Returns a median estimate of the clock difference between client and
   * server. If no data is yet available, error is thrown.
   */
  get() {
    if(this.min === null || this.max === null) {
      throw new Error("Cannot fetch lag estimate without data");
    }
    return (this.min + this.max) / 2;
  }
}

export {LagEstimator}
