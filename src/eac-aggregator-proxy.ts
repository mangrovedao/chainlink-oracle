import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
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
    const description = contract.try_description();
    if (description.reverted) {
      return pair;
    }

    const baseQuote = description.value.replaceAll(' ', '').split('/');

    if (baseQuote.length != 2) {
      return pair; 
    }

    const decimals = contract.try_decimals();
    if (decimals.reverted) {
      return pair;
    }

    pair.decimals = BigInt.fromI32(decimals.value);
    pair.base = baseQuote[0];
    pair.quote = baseQuote[1];

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
  if (key != "ETH/USD") {
    return;
  }

  price.pair = pair.id;
  price.price = event.params.current;
  price.updatedAt = event.params.updatedAt;
  price.blockNumber = event.block.number;
  price.transactionHash = event.transaction.hash;

  price.save();
}
