import { Address, ethereum, log } from "@graphprotocol/graph-ts";
import {
  AnswerUpdated as AnswerUpdatedEvent,
  EACAggregatorProxy,
} from "../generated/EACAggregatorProxy/EACAggregatorProxy"
import {
  Pair, 
  Price,
} from "../generated/schema"

export const getEventUniqueId = (event: ethereum.Event): string => {
  return `${event.transaction.hash.toHex()}-${event.logIndex.toHex()}`;
};

export const createPairOrFail = (address: Address): Pair => {
  let pair = Pair.load(address);
  if (!pair) {
    pair = new Pair(address);
    pair.save();

    const contract = EACAggregatorProxy.bind(address);
    const description = contract.description();
    const baseQuote = description.replaceAll(' ', '').split('/');

    if (baseQuote.length != 2) {
      return pair; 
    }

    pair.base = baseQuote[0];
    pair.quote = baseQuote[1];
    log.info("create pair {}/{}", [pair.base!, pair.quote!]);

    pair.save();
  }

  return pair;
};


export function handleAnswerUpdated(event: AnswerUpdatedEvent): void {
  const pair = createPairOrFail(event.address);
  if (!pair || !pair.base || !pair.quote) {
    return;
  }

  const price = new Price(getEventUniqueId(event));
  const key = `${pair.base!}/${pair.quote!}`;
  if (key !== "ETH/USD") {
    return;
  }

  price.pair = pair.id;
  price.price = event.params.current;
  price.updatedAt = event.params.updatedAt;
  price.blockNumber = event.block.number;
  price.transactionHash = event.transaction.hash;

  price.save();
}
