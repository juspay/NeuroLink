import { describe, it, expect } from "vitest";
import yargs from "yargs";
import { CLICommandFactory } from "../../../src/cli/factories/commandFactory.js";

const buildGenerateParser = () => {
  const command = CLICommandFactory.createGenerateCommand();
  const parser = yargs([]).exitProcess(false).help(false).version(false);

  if (command.builder) {
    return command.builder(parser);
  }

  return parser;
};

describe("PPT CLI Flags Configuration", () => {
  it("should expose PPT aliases on generate command", () => {
    const parser = buildGenerateParser();
    const options = parser.getOptions();
    const optionNames = Object.keys(options.alias);

    expect(optionNames).toContain("pptPages");
    expect(optionNames).toContain("pptOutput");

    expect(options.alias.pptPages).toContain("pages");
    expect(options.alias.pptOutput).toContain("po");
  });

  it("should parse PPT mode options and aliases into normalized argv", () => {
    const parser = buildGenerateParser();

    const argv = parser.parseSync([
      "AI roadmap",
      "--outputMode",
      "ppt",
      "--pages",
      "12",
      "--pptTheme",
      "modern",
      "--pptAudience",
      "technical",
      "--pptTone",
      "educational",
      "--po",
      "./slides.pptx",
      "--pptAspectRatio",
      "4:3",
      "--pptNoImages",
    ]);

    expect(argv.outputMode).toBe("ppt");
    expect(argv.pptPages).toBe(12);
    expect(argv.pptTheme).toBe("modern");
    expect(argv.pptAudience).toBe("technical");
    expect(argv.pptTone).toBe("educational");
    expect(argv.pptOutput).toBe("./slides.pptx");
    expect(argv.pptAspectRatio).toBe("4:3");
    expect(argv.pptNoImages).toBe(true);
  });

  it("should keep pptNoImages default as false when not provided", () => {
    const parser = buildGenerateParser();
    const argv = parser.parseSync(["AI roadmap", "--outputMode", "ppt"]);

    expect(argv.pptNoImages).toBe(false);
  });

  it("should fail fast when video and PPT mode signals are mixed", () => {
    const detectGenerateOutputMode = (
      CLICommandFactory as unknown as {
        detectGenerateOutputMode: (
          argv: Record<string, unknown>,
          options: Record<string, unknown>,
        ) => {
          isVideoMode: boolean;
          isPPTMode: boolean;
          spinnerMessage: string;
        };
      }
    ).detectGenerateOutputMode;

    expect(() =>
      detectGenerateOutputMode(
        {
          pptPages: 10,
          pptTheme: undefined,
          pptAudience: undefined,
          pptTone: undefined,
          pptOutput: undefined,
          pptAspectRatio: undefined,
          pptNoImages: false,
          videoOutput: undefined,
        },
        { outputMode: "video" },
      ),
    ).toThrow(/Conflicting output mode signals detected/);
  });
});
