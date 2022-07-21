import { Ok } from "@davidsouther/jiffies/lib/esm/result";
import { Projects } from ".";
import { Cmp, CMP } from "../languages/cmp";
import { HDL, HdlParse } from "../languages/hdl";
import { Tst, TST } from "../languages/tst";
import { PROJECTS } from "../pages/chip.store";
import { build } from "../simulator/chip/builder";
import { Chip } from "../simulator/chip/chip";
import { compare } from "../simulator/compare";
import { ChipTest } from "../simulator/tst";

describe("All Projects", () => {
  describe.each(Object.keys(PROJECTS))("project %s", (project) => {
    it.each(PROJECTS[project as keyof typeof PROJECTS])(
      "Chip %s",
      async (chipName) => {
        // @ts-ignore
        const hdlFile = Projects[project]?.SOLS[chipName]?.[`${chipName}.hdl`];
        // @ts-ignore
        const tstFile = Projects[project]?.CHIPS[chipName]?.[`${chipName}.tst`];
        // @ts-ignore
        const cmpFile = Projects[project]?.CHIPS[chipName]?.[`${chipName}.cmp`];

        expect(hdlFile).toBeDefined();
        expect(tstFile).toBeDefined();
        expect(cmpFile).toBeDefined();

        const hdl = HDL.parse(hdlFile);
        expect(hdl).toBeOk();
        const tst = TST.parse(tstFile);
        expect(tst).toBeOk();

        const chip = build(Ok(hdl as Ok<HdlParse>));
        expect(chip).toBeOk();
        const test = ChipTest.from(Ok(tst as Ok<Tst>)).with(
          Ok(chip as Ok<Chip>)
        );

        await test.run();

        const outFile = test.log();

        const cmp = CMP.parse(cmpFile);
        expect(cmp).toBeOk();
        const out = CMP.parse(outFile);
        expect(out).toBeOk();

        const diffs = compare(Ok(cmp as Ok<Cmp>), Ok(out as Ok<Cmp>));
        expect(diffs).toEqual([]);
      }
    );
  });
});
