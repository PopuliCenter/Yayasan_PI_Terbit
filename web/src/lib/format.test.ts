import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Author } from "@/payload-types";
import {
  byline,
  CONTRIBUTOR_ROLES,
  contributorEntries,
  contributorNames,
  contributorPhrase,
  contributorsOf,
  type Contributors,
  joinNames,
  listSeparator,
  rolesOf,
} from "./format";

const person = (id: number, name: string): Author => ({ id, name }) as Author;
const A = person(1, "Ani");
const B = person(2, "Budi");
const C = person(3, "Citra");
const D = person(4, "Dewi");

const names = (c: Partial<Contributors>): Contributors => ({ authors: [], editors: [], translators: [], ...c });

describe("joinNames dan listSeparator", () => {
  it("koma serial sebelum 'dan' untuk tiga nama atau lebih (EYD)", () => {
    assert.equal(joinNames([]), "");
    assert.equal(joinNames(["A"]), "A");
    assert.equal(joinNames(["A", "B"]), "A dan B");
    assert.equal(joinNames(["A", "B", "C"]), "A, B, dan C");
    assert.equal(joinNames(["A", "B", "C", "D"]), "A, B, C, dan D");
  });

  it("nama + listSeparator sama dengan joinNames untuk 1 sampai 5 nama", () => {
    const all = ["A", "B", "C", "D", "E"];
    for (let n = 1; n <= 5; n++) {
      const list = all.slice(0, n);
      assert.equal(list.map((x, i) => x + listSeparator(i, n)).join(""), joinNames(list), `n=${n}`);
    }
  });

  it("nama terakhir tanpa pemisah", () => {
    assert.equal(listSeparator(0, 1), "");
    assert.equal(listSeparator(2, 3), "");
  });
});

describe("contributorsOf dan contributorNames", () => {
  it("melewati ID mentah dan mempertahankan urutan buku", () => {
    const book = { authors: [B, 99, A], editors: [C], translators: [7, D] };
    const people = contributorsOf(book);
    assert.deepEqual(
      people.authors.map((a) => a.id),
      [2, 1],
    );
    assert.deepEqual(contributorNames(book), { authors: ["Budi", "Ani"], editors: ["Citra"], translators: ["Dewi"] });
  });

  it("penyunting dan penerjemah null atau tidak ada menjadi []", () => {
    assert.deepEqual(contributorNames({ authors: [A], editors: null }), {
      authors: ["Ani"],
      editors: [],
      translators: [],
    });
    assert.deepEqual(contributorNames({}), { authors: [], editors: [], translators: [] });
  });

  it("urutan peran: penulis, penyunting, penerjemah", () => {
    assert.deepEqual(
      CONTRIBUTOR_ROLES.map((r) => r.label),
      ["Penulis", "Penyunting", "Penerjemah"],
    );
  });
});

describe("byline", () => {
  it("satu sampai tiga penulis ditulis lengkap", () => {
    assert.equal(byline(names({ authors: ["A"] })), "A");
    assert.equal(byline(names({ authors: ["A", "B"] })), "A dan B");
    assert.equal(byline(names({ authors: ["A", "B", "C"] })), "A, B, dan C");
  });

  it("lebih dari tiga penulis disingkat dkk.", () => {
    assert.equal(byline(names({ authors: ["A", "B", "C", "D"] })), "A, B, dkk.");
  });

  it("hanya penyunting: (ed.), juga untuk beberapa penyunting", () => {
    assert.equal(byline(names({ editors: ["X"] })), "X (ed.)");
    assert.equal(byline(names({ editors: ["X", "Y"] })), "X dan Y (ed.)");
    assert.equal(byline(names({ editors: ["X", "Y", "Z", "W"] })), "X, Y, dkk. (ed.)");
  });

  it("ada penulis: penyunting tidak ditampilkan; penerjemah tidak pernah ditampilkan", () => {
    assert.equal(byline(names({ authors: ["A"], editors: ["X"], translators: ["T"] })), "A");
    assert.equal(byline(names({ translators: ["T"] })), "");
    assert.equal(byline(names({})), "");
  });

  it("max=Infinity tidak pernah menyingkat", () => {
    assert.equal(byline(names({ authors: ["A", "B", "C", "D", "E"] }), Infinity), "A, B, C, D, dan E");
  });
});

describe("contributorPhrase", () => {
  it("penulis: karya …", () => {
    assert.equal(contributorPhrase(names({ authors: ["A", "B"] })), "karya A dan B");
  });
  it("hanya penyunting: suntingan …", () => {
    assert.equal(contributorPhrase(names({ editors: ["X"] })), "suntingan X");
  });
  it("dengan penerjemah: diakhiri diterjemahkan oleh …", () => {
    assert.equal(
      contributorPhrase(names({ editors: ["X"], translators: ["Y"] })),
      "suntingan X, diterjemahkan oleh Y",
    );
    assert.equal(
      contributorPhrase(names({ authors: ["A"], translators: ["Y", "Z"] })),
      "karya A, diterjemahkan oleh Y dan Z",
    );
  });
  it("tanpa kontributor: kosong", () => {
    assert.equal(contributorPhrase(names({})), "");
  });
});

describe("rolesOf", () => {
  it("bekerja dengan objek ter-populate dan ID mentah", () => {
    assert.deepEqual(rolesOf({ authors: [A], editors: [2] }, 1), ["authors"]);
    assert.deepEqual(rolesOf({ authors: [A], editors: [2] }, 2), ["editors"]);
    assert.deepEqual(rolesOf({ translators: [C] }, 3), ["translators"]);
  });
  it("penulis sekaligus penyunting mendapat dua peran", () => {
    assert.deepEqual(rolesOf({ authors: [A, B], editors: [1] }, 1), ["authors", "editors"]);
  });
  it("orang yang tidak terkait: []", () => {
    assert.deepEqual(rolesOf({ authors: [A], editors: null }, 42), []);
  });
});

describe("contributorEntries", () => {
  it("tanpa duplikat, urutan peran, dan semua peran per orang", () => {
    const entries = contributorEntries({ authors: [A], editors: [B, A], translators: [C, B] });
    assert.deepEqual(
      entries.map((e) => [e.person.id, e.roles]),
      [
        [1, ["authors", "editors"]],
        [2, ["editors", "translators"]],
        [3, ["translators"]],
      ],
    );
  });
});
