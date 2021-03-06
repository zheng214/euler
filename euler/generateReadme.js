// generates a glossary of solved problems

const fs = require('fs');
const lineReader = require('readline');
const Promise = require('bluebird');

const stream = fs.createWriteStream('README.md');

const results = require('./results.json');

stream.once('open', async (fd) => {
  stream.write('## <p align="center"> Project Euler Menu </p>');
  stream.write('\n\n');
  stream.write('**This repository contains my solutions to the problems of Project Euler** ');
  stream.write('(<a href="https://projecteuler.net/about" title="https://projecteuler.net/about">Official website</a> / ');
  stream.write('<a href="https://en.wikipedia.org/wiki/Project_Euler" title="https://en.wikipedia.org/wiki/Project_Euler">Wikipedia</a>)');
  stream.write('\n\n');
  stream.write('Each numbered folder contains **10** solutions.');
  stream.write('The solutions are ordered (ie. `1/index.js` solves problems 1-10, `2/index.js` solves problems 11-20, etc.)');
  stream.write('\n\n');
  stream.write('All solutions can be run from the **command line** (eg. `node main 51` will execute the solution program for Problem 51)');
  stream.write('\n\n');
  stream.write('Click on the **problem title** to go to the **code solution**');
  stream.write('\n\n');
  stream.write('Click the **Official Link** to go to the **official problem statement** on the Project Euler website');
  stream.write('\n\n');
  stream.write('The **answers** and **time of execution** can be found in the table below ');
  stream.write('(answers are partially blurred with respect to Project Euler\'s etiquette)');
  stream.write('\n\n<br/><br/>\n\n');
  stream.write('## <p align="center"> Problems & Solutions </p>');
  stream.write('\n');
  stream.write('**Problem** | **Description**| **Result** | **Time** | **Official Link**');
  stream.write('\n ------------|----------------|------------|----------|---------- \n');
  await generateMenu();
  stream.write('\n\n');
  stream.write('<a href="#">Go to top</a>');
  stream.end();
});

function generateMenu() {
  return new Promise((resolve) => {
    fs.readdir('.', async (err, files) => {
      await Promise.each(files, async file => generateFileMenu(file));
      resolve();
    });
  });
}

function generateFileMenu(file) {
  return new Promise((resolve) => {
    // find directories with name "1, 2, 3, ..., 99";
    if (/\d{1,2}/.test(file) && fs.lstatSync(file).isDirectory()) {
      const lineStreamer = lineReader.createInterface({
        input: fs.createReadStream(`${file}/index.js`),
      });

      let currentLine = 1;
      let prevLine = '';

      // store line number and title of a problem
      let startLine;
      let problemID;
      let problemName;

      // store description of a problem
      let inDescription = false;
      let problemDetails = [];

      // store question statement
      let questionLines = [];

      // track the difference of "{" and "}" inside a solution. bracketBalance === 0 marks the end of the solution
      let bracketBalance;
      let inSolution = false;

      lineStreamer.on('line', (line) => {
        // escape pipe characters (md table formatting)
        line = line.replace(/\|/g, '\\|');
        // matches the start of problem description
        const problemStartMatch = !inDescription && !inSolution && line.match(/Problem (\d{1,3})[^\w]*(\w.+)$/);
        // matches question statement
        const questionMatch = line.match(/@question/);
        // matches the start of the solution
        const functionMatch = line.match(/e\d{1,3}\(\) \{/);

        // entering description
        if (problemStartMatch) {
          [, problemID, problemName] = problemStartMatch;
          startLine = currentLine - 1;
          inDescription = true;
        }

        // entering question statement
        if (questionMatch && !functionMatch) {
          const isPrevLineQuestion = prevLine.match('@question');
          const statement = line.replace(/(^.+\*)/, '');
          if (isPrevLineQuestion) {
            // 2nd @question
            questionLines.push(statement.replace('@question', ''));
          } else {
            // empty or title, no need to add line break
            questionLines.push(`${statement.replace('@question', '<strong>Question:</strong>')}`);
          }
        }

        // if line does not match title or start of solution, then it must be in description
        if (!problemStartMatch && !questionMatch && !functionMatch && inDescription) {
          // skip extra line (*/) at then end of every problem description
          if (!line.match(/\*\//)) {
            const statement = line.replace(/(^[^*]+\*)/, '');
            problemDetails.push(statement);
          }
        }

        // entering solution
        if (functionMatch) {
          inDescription = false;
          bracketBalance = 0;
          inSolution = true;
        }

        // if we are in solution, keep track of the balancing of { and }
        // if they are equal, then it marks the end of a solution
        if (inSolution) {
          const leftBrackets = (line.split('//')[0].match(/\{/g) || []).length;
          const rightBrackets = (line.split('//')[0].match(/\}/g) || []).length;
          bracketBalance += leftBrackets - rightBrackets;
          if (bracketBalance === 0) {
            // end of solution detected, write all stored content of problem
            const githubURLTemplate = 'https://github.com/zheng214/euler/blob/master/euler/{folder}/index.js#L{start}-L{end}';
            const githubURL = githubURLTemplate
              .replace('{folder}', file)
              .replace('{start}', startLine)
              .replace('{end}', currentLine);

            const eulerURLTemplate = 'https://projecteuler.net/problem={problem}';
            const eulerURL = eulerURLTemplate
              .replace('{problem}', problemID);

            // add line break between problem and question
            let breakProblemQuestion = '';
            if (problemDetails.length) {
              breakProblemQuestion = problemDetails[problemDetails.length - 1] ? '<br/><br/>' : '<br/>';
            }

            stream.write(`**${problemID}.** [${problemName}](${githubURL}) | `);
            stream.write(`${problemDetails.join('<br/>')}${breakProblemQuestion}${questionLines.join('<br/>')} | `);
            stream.write(`${results[problemID].answer} | `);
            stream.write(`${results[problemID].time} | `);
            stream.write(`[:arrow_upper_right:](${eulerURL})`);

            stream.write('<br/><br/>\n');

            // exiting solution
            inSolution = false;
            problemDetails = [];
            questionLines = [];
          }
        }
        currentLine++;
        prevLine = line;
      });
      lineStreamer.on('close', () => {
        resolve();
      });
    } else {
      resolve();
    }
  });
}
