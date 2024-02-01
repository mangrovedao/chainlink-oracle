import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
  createMockedFunction
} from "matchstick-as/assembly/index"
import { BigInt, Address, ethereum } from "@graphprotocol/graph-ts"
import { getEventUniqueId, handleAnswerUpdated } from "../src/eac-aggregator-proxy"
import { createAnswerUpdatedEvent } from "./eac-aggregator-proxy-utils"

const prepareOracle = (address: Address, description: string): void => {
  createMockedFunction(address, "description", "description():(string)").returns([ethereum.Value.fromString(description)]);
}

const address = Address.fromString("0x0000000000000000000000000000000000000001");

prepareOracle(address, "ETH / USD");
// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {

  });

  afterAll(() => {
    clearStore()
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("Pair created and stored", () => {
    const current = BigInt.fromI32(10000);
    const roundId = BigInt.fromI32(0);
    const updatedAt = BigInt.fromI32(1234);

    const newAnswerUpdatedEvent = createAnswerUpdatedEvent(
      current,
      roundId,
      updatedAt
    );
    newAnswerUpdatedEvent.address = address;

    handleAnswerUpdated(newAnswerUpdatedEvent);

    assert.entityCount("Pair", 1);
    assert.entityCount("Price", 1);

    assert.fieldEquals(
      "Pair",
      address.toHex(),
      "base",
      "ETH"
    );

    assert.fieldEquals(
      "Pair",
      address.toHex(),
      "quote",
      "USD"
    );

    const priceId = getEventUniqueId(newAnswerUpdatedEvent);

    assert.fieldEquals("Price", priceId, "pair", address.toHex());
    assert.fieldEquals("Price", priceId, "price", current.toString()); 
    assert.fieldEquals("Price", priceId, "updatedAt", updatedAt.toString()); 
    assert.fieldEquals("Price", priceId, "blockNumber", newAnswerUpdatedEvent.block.number.toString());
    assert.fieldEquals("Price", priceId, "transactionHash", newAnswerUpdatedEvent.transaction.hash.toHex());

    const current2 = BigInt.fromI32(20000);
    const roundId2 = BigInt.fromI32(1);
    const updatedAt2 = BigInt.fromI32(4321);

    const newAnswerUpdatedEvent2 = createAnswerUpdatedEvent(
      current2,
      roundId2,
      updatedAt2
    );
    newAnswerUpdatedEvent2.logIndex = newAnswerUpdatedEvent2.logIndex.plus(BigInt.fromI32(1));
    newAnswerUpdatedEvent2.address = address;

    handleAnswerUpdated(newAnswerUpdatedEvent2);

    const priceId2 = getEventUniqueId(newAnswerUpdatedEvent2);

    assert.fieldEquals("Price", priceId2, "pair", address.toHex());
    assert.fieldEquals("Price", priceId2, "price", current2.toString()); 
    assert.fieldEquals("Price", priceId2, "updatedAt", updatedAt2.toString()); 
    assert.fieldEquals("Price", priceId2, "blockNumber", newAnswerUpdatedEvent2.block.number.toString());
    assert.fieldEquals("Price", priceId2, "transactionHash", newAnswerUpdatedEvent2.transaction.hash.toHex());

    assert.entityCount("Pair", 1);
    assert.entityCount("Price", 2);
  });
});
