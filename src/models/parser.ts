import _ from "lodash";
import { Clipping, GroupedClipping } from "../interfaces";
import { writeToFile, readFromFile, formatAuthorName } from "../utils";
import { Highlight } from "../interfaces/clipping";

export class Parser {
  private fileName = "My Clippings.txt";
  private regex =
    /(?<BookName>.+) \((?<Author>.+)\)\r*\n- [ ]?(?:Your Highlight|La subrayado|La tua evidenziazione|La mia evidenziazione|\u60a8\u5728\u4f4d) (?:on Location|en la posición|Posizione|alla posizione|a pagina (?<Page>[0-9]+) \| posizione)[ ](?<StartPosition>[0-9]*)[-]?(?<EndPosition>[0-9]*)?[ ](.+)\r*\n\r*\n(?<Note>.+)/gm;  private regexNote =
    /(?<BookName>.+) \((?<Author>.+)\)\r*\n- [ ]?(?:Your Note|La tua nota|\u60a8\u5728\u4f4d) (?:on Location|en la posición|alla posizione|a pagina (?<Page>[0-9]+) \| posizione)[ ](?<StartPosition>[0-9]*)[ ](.+)\r*\n\r*\n(?<Note>.+)/gm
  private splitter = /=+\r*\n/gm;
  private nonUtf8 = /\uFEFF/gmu;
  private clippings: Clipping[] = [];
  private groupedClippings: GroupedClipping[] = [];

  /* Method to print the stats of Clippings read from My Clippings.txt */
  printStats = () => {
    console.log("\n💹 Stats for Clippings");
    for (const groupedClipping of this.groupedClippings) {
      console.log("--------------------------------------");
      console.log(`📝 Title: ${groupedClipping.title}`);
      console.log(`🙋 Author: ${groupedClipping.author}`);
      console.log(`💯 Highlights Count: ${groupedClipping.highlights.filter(x => !x.isNote).length}`);
      console.log(`💯 Notes Count: ${groupedClipping.highlights.filter(x => x.isNote).length}`);
    }
    console.log("--------------------------------------");
  };

  /* Method to export the final grouped clippings to a file */
  exportGroupedClippings = () => {
    writeToFile(this.groupedClippings, "grouped-clippings.json", "data");
  };
 
  /* Method add the parsed clippings to the clippings array */
  addToClippingsArray = (match: RegExpExecArray | null) => {
    if (match) {
      const groups = (match as any).groups as MatchGroups;      
      const title = groups.BookName;
      let author = formatAuthorName(groups.Author);
      let page;
      if (!isNaN(Number(groups.Page))) {
        page = Number(groups.Page);
      }
      
      const startPosition = Number(groups.StartPosition);
      const endPosition = Number(groups.EndPosition);
      const highlight = groups.Note;
      const isNote = false;
  
      this.clippings.push({ title, author, highlight, page, startPosition, endPosition, isNote });
    }
  };
  
  /* Method add the parsed clippings to the clippings array */
  addNoteToClippingsArray = (match: RegExpExecArray | null) => {
    if (match) {
      const groups = (match as any).groups as MatchGroups;
      const title = groups.BookName;
      let author = formatAuthorName(groups.Author);
      const page = Number(groups.Page);
      const startPosition = Number(groups.StartPosition);
      const endPosition = undefined;
      const highlight = groups.Note;
      const isNote = true;

      this.clippings.push({ title, author, highlight, page, startPosition, endPosition, isNote });
    }
  };

  /* Method to group clippings (highlights) by the title of the book */
  groupClippings = () => {
    console.log("\n➕ Grouping Clippings");
    this.groupedClippings = _.chain(this.clippings)
      .groupBy("title")
      .map((clippings, title) => ({
        title,
        author: clippings[0].author,
        highlights: clippings.map<Highlight>((clipping) => ({
          highlight: clipping.highlight,
          page: clipping.page,
          startPosition: clipping.startPosition,
          endPosition: clipping.endPosition,
          isNote: clipping.isNote
        }))
      }))
      .value();

    // remove duplicates in the highlights for each book
    this.groupedClippings = this.groupedClippings.map((groupedClipping) => {
      return {
        ...groupedClipping,
        highlights: [...new Set(groupedClipping.highlights)],
      };
    });
  };

  /* Method to parse clippings (highlights) and add them to the clippings array */
  parseClippings = () => {
    console.log("📋 Parsing Clippings");
    const clippingsRaw = readFromFile(this.fileName, "resources");

    // filter clippings to remove the non-UTF8 character
    const clippingsFiltered = clippingsRaw.replace(this.nonUtf8, "");

    // split clippings using splitter regex
    const clippingsSplit = clippingsFiltered.split(this.splitter);

    // parse clippings using regex
    for (let i = 0; i < clippingsSplit.length - 1; i++) {
      const clipping = clippingsSplit[i];
      const regex = new RegExp(this.regex.source);
      var match = regex.exec(clipping);

      if (match != null) {
        this.addToClippingsArray(match);
      }
      else {
        const regexNote = new RegExp(this.regexNote.source);
        match = regexNote.exec(clipping);
        this.addNoteToClippingsArray(match);
      }
    }
  };

  /* Wrapper method to process clippings */
  processClippings = (): GroupedClipping[] => {
    this.parseClippings();
    this.groupClippings();
    this.exportGroupedClippings();
    this.printStats();
    return this.groupedClippings;
  };
}

interface MatchGroups {
  BookName: string;
  Author: string;
  Page: string;
  StartPosition: string;
  EndPosition: string;
  Note: string;
}