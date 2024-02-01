import { Address, ethereum } from "@graphprotocol/graph-ts";
import {
  AnswerUpdated as AnswerUpdatedEvent,
  EACAggregatorProxy,
  NewRound as NewRoundEvent,
  OwnershipTransferRequested as OwnershipTransferRequestedEvent,
  OwnershipTransferred as OwnershipTransferredEvent
} from "../generated/EACAggregatorProxy/EACAggregatorProxy"
import {
  Pair, Price,
} from "../generated/schema"

export const getEventUniqueId = (event: ethereum.Event): string => {
  return `${event.transaction.hash.toHex()}-${event.logIndex.toHex()}`;
};

export const getOrCreatePair = (address: Address): Pair => {
  let pair = Pair.load(address);
  if (!pair) {
    pair = new Pair(address);

    const contract = EACAggregatorProxy.bind(address);
    const baseQuote = contract.description().replaceAll(' ', '').split('/');

    pair.base = baseQuote[0];
    pair.quote = baseQuote[1];

    pair.save();
  }

  return pair;
};


export function handleAnswerUpdated(event: AnswerUpdatedEvent): void {
  const pair = getOrCreatePair(event.address);
  if (!pair) {
    throw new Error("Missing pair");
  }

  const price = new Price(getEventUniqueId(event));
  price.pair = pair.id;
  price.price = event.params.current;
  price.updatedAt = event.params.updatedAt;
  price.blockNumber = event.block.number;
  price.transactionHash = event.transaction.hash;

  price.save();
}

export function handleNewRound(event: NewRoundEvent): void {
}

export function handleOwnershipTransferRequested(
  event: OwnershipTransferRequestedEvent
): void {
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
}
