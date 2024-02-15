const fs = require("fs").promises;
const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

const port = 3000;

const dotenv = require("dotenv");
const { OpenAI } = require("openai");

dotenv.config({ path: "./local.env" });
const DB_URL = process.env.DATABASE_URL;
try {
  DB_URL &&
    mongoose.connect(DB_URL).then((con) => {
      // console.log(con.connections);
      console.log("Database connected!");
    });
} catch (error) {
  console.error("Error connecting to database:", error);
}

const summarySchema = new mongoose.Schema({
  chapter: String,
  subchapter: String,
  summary: String,
});

const Summary = mongoose.model("Summary", summarySchema);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateSummary(userQuery, bookDescription) {
  try {
    const prompt = `Directive:** You are an expert in creating detailed summaries for various topics, specializing in generating comprehensive analyses based on minimal input. Your task is to craft an extensive summary on a specific subject provided by the user, enriching your summary with illustrative examples for clarity and depth.

        **Input Text:**
        - **Topic of Interest:** ** ${userQuery}** - This is the primary focus for your summary. Dive deep into this subject, exploring its nuances, background, and relevance.
        - **Book Description:** ** ${bookDescription}** - Use this brief overview as a foundation to draw connections, themes, and insights. Your summary should not only cover the broader topic but also relate specifically to the angles and themes highlighted in this description.
        
        **Output Text Requirements:**
        
        1. **Introduction:** Start with a brief introduction to the ** ${userQuery} **, setting the stage for a deeper exploration.
        2. **Main Body:**
            - **Subchapter Summaries:** Break down the topic into subchapters or key areas, using the book description as a guide to align your summary closely with the book's content and themes.
            - **Examples:** For each subchapter or key area, provide specific examples that illustrate the main points, drawing parallels to the book description where applicable.
        3. **Conclusion:** Conclude with a synthesis of the key insights covered, emphasizing how the examples and subchapters relate to the overall topic and the book description provided.
        
        **Objective:** Your goal is to produce a summary that is not only informative and comprehensive but also engaging and reflective of the themes presented in the book description. Through your summary, the reader should gain a deeper understanding of ** ${userQuery} ** and how it is explored or represented in the book.`;

    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      stream: true,
      max_tokens: 4096,
    });

    let fullResponse = ""; // Initialize an empty string to accumulate the response
    for await (const chunk of stream) {
      // Assuming `chunk.choices[0]?.delta?.content` is the correct path to the response content
      let content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content; // Accumulate the content into fullResponse
    }
    console.log(fullResponse);
    return fullResponse; // Optionally return the full response for further processing
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

const bookContent = {
  introduction: {
    1.1: "A brief history of computing",
    1.2: "What is computer science?",
    1.3: "An overview of computer hardware",
    1.4: "Algorithms",
    1.5: "Stages in the programming process",
    1.6: "Java and the object-oriented paradigm",
    1.7: "Java and the World Wide Web",
  },
  programming_by_example: {
    2.1: "The “Hello World” program",
    2.2: "Perspectives on the Programming Process",
    2.3: "A program to add two numbers",
    2.4: "Classes and objects",
  },
  expressions: {
    3.1: "Primitive data types",
    3.2: "Constants and variables",
    3.3: "Operators and operands",
    3.4: "Assignment statements",
    3.5: "Programming idioms and patterns",
  },
  statement_forms: {
    4.1: "Simple statements",
    4.2: "Control statements",
    4.3: "Boolean data",
    4.4: "The if statement",
    4.5: "The switch statement",
    4.6: "The concept of iteration",
    4.7: "The while statement",
    4.8: "The for statement",
  },
  methods: {
    5.1: "A quick overview of methods",
    5.2: "Methods and the object-oriented paradigm",
    5.3: "Writing your own methods",
    5.4: "Mechanics of the method-calling process",
    5.5: "Algorithmic methods",
  },
  objects_and_classes: {
    6.1: "Using the RandomGenerator class",
    6.2: "Defining your own classes",
    6.3: "Defining a class to represent rational numbers",
  },
  the_object_memory_model: {
    7.1: "The structure of memory",
    7.2: "Allocation of memory to variables",
    7.3: "Primitive types vs. objects",
    7.4: "Linking objects together",
  },
  object_oriented_graphics: {
    8.1: "The acm.graphics model",
    8.2: "The Graphics Class Hierarchy",
    8.3: "Facilities available in the GraphicsProgram class",
    8.4: "Animation and interactivity",
    8.5: "Creating Compound Objects",
    8.6: "Principles of good object-oriented design",
  },
  strings_and_characters: {
    9.1: "The principle of enumeration",
    9.2: "Characters",
    9.3: "Strings as an abstract idea",
    9.4: "Using the methods in the String class",
  },
  arrays_and_arrayLists: {
    10.1: "Introduction to arrays",
    10.2: "Internal representation of arrays",
    10.3: "Passing arrays as parameters",
    10.4: "The ArrayList class",
    10.5: "Using arrays for tabulation",
    10.6: "Initialization of arrays",
    10.7: "Multidimensional arrays",
  },
  searching_and_sorting: {
    11.1: "Searching",
    11.2: "Sorting",
  },
};

const bookDescription = `"Introduction to Java Programming" offers a comprehensive exploration of computer science fundamentals, focusing on Java programming and object-oriented concepts. Beginning with a historical overview of computing, the book delves into the essence of computer science, detailing hardware components and essential algorithms. Readers are guided through the stages of the programming process, with a special emphasis on Java and its application in web development.`;

// Iterate over each chapter
// async function processBookContents() {
//   for (const chapter in bookContent) {
//     for (const subchapter in bookContent[chapter]) {
//       const subchapterTitle = bookContent[chapter][subchapter];
//       let summary = await generateSummary(subchapterTitle, bookDescription);
//       const fileName = `Chapter-${chapter}-Subchapter-${subchapter}.txt`;
//       await fs.writeFile(fileName, summary);
//       console.log(`Saved summary for ${subchapterTitle} to ${fileName}`);
//     }
//   }
// }

// Make sure to call your main function to start the process
// processBookContents().then(() =>
//   console.log("All summaries have been generated and saved.")
// );

app.get("/summary/:chapter/:subchapter", async (req, res) => {
  const { chapter, subchapter } = req.params;
  if (!chapter || !subchapter) {
    return res
      .status(400)
      .send("Missing required query parameters: chapter and subchapter");
  }

  const subchapterTitle = bookContent[chapter][subchapter];
  if (!subchapterTitle) {
    return res.status(404).send("Chapter or subchapter not found");
  }

  try {
    let summary = await Summary.findOne({ chapter, subchapter });
    if (!summary) {
      const summaryText = await generateSummary(
        subchapterTitle,
        bookDescription
      );
      summary = new Summary({ chapter, subchapter, summary: summaryText });
      await summary.save();
    }
    res.send(summary);
  } catch (error) {
    console.error("Error in generating or retrieving summary:", error);
    res.status(500).send("Error in generating or retrieving summary");
  }
});

app.put("/summary/:chapter/:subchapter", async (req, res) => {
  const { chapter, subchapter } = req.params;
  const { summary } = req.body;
  if (!chapter || !subchapter || !summary) {
    return res
      .status(400)
      .send("Missing required parameters: chapter, subchapter, and summary");
  }

  try {
    const updatedSummary = await Summary.findOneAndUpdate(
      { chapter, subchapter },
      { summary },
      { new: true }
    );
    if (!updatedSummary) {
      return res.status(404).send("Summary not found");
    }
    res.send(updatedSummary);
  } catch (error) {
    console.error("Error in updating summary:", error);
    res.status(500).send("Error in updating summary");
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
