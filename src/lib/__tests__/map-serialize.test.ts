import { describe, expect, it } from "vitest";
import { serializeMap, type MapRecord } from "../map-serialize";

describe("serializeMap", () => {
  it("returns null for a page without a plan", () => {
    expect(serializeMap(null)).toBeNull();
  });

  it("converts dates to ISO strings and narrows the owner type", () => {
    const now = new Date("2026-09-08T10:00:00.000Z");
    const record = {
      id: "map1",
      pageId: "page1",
      title: "Path to go-live",
      closeDate: new Date("2026-10-01T00:00:00.000Z"),
      createdAt: now,
      updatedAt: now,
      items: [
        {
          id: "i1",
          mapId: "map1",
          title: "Security review",
          ownerType: "buyer",
          ownerName: "Jane",
          dueDate: null,
          completed: false,
          order: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "i2",
          mapId: "map1",
          title: "Send the contract",
          ownerType: "unexpected-value",
          ownerName: "",
          dueDate: new Date("2026-09-15T00:00:00.000Z"),
          completed: true,
          order: 1,
          createdAt: now,
          updatedAt: now,
        },
      ],
    } as unknown as MapRecord;

    const map = serializeMap(record);
    expect(map?.closeDate).toBe("2026-10-01T00:00:00.000Z");
    expect(map?.items[0]).toMatchObject({ ownerType: "buyer", dueDate: null });
    expect(map?.items[1]).toMatchObject({
      ownerType: "seller",
      dueDate: "2026-09-15T00:00:00.000Z",
      completed: true,
    });
  });
});
