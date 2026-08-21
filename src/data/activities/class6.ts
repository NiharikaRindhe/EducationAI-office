import { activity, Q, type ChapterActivity } from './types';

const C = 6 as const;

export const CLASS_6_ACTIVITIES: ChapterActivity[] = [
  // ── Mathematics ──────────────────────────────────────────────
  activity({
    classNum: C, subject: 'Mathematics', chapterNum: 1, chapterTitle: 'Knowing Our Numbers',
    slug: 'numbers', name: 'Rounding & Roman Numerals', icon: '🔢',
    description: 'Indian place value, estimation, rounding large numbers, and Roman numerals.',
    questions: [
      Q.short('Round 4,56,789 to the nearest thousand.', '457000', {
        accepted: ['457000', '4,57,000', '4,57,000', '4 57 000'],
        scene: 'At a wholesale market the crate stamp reads 4,56,789 packets. The clerk must report the count to the nearest thousand.',
        rubric: 'Look at the hundreds digit 7 (≥5), so 4,56,789 rounds up to 4,57,000.',
      }),
      Q.mcq('The place of 5 in 45,67,890 (Indian system) is', ['thousands', 'ten thousands', 'lakhs', 'ten lakhs'], 2, {
        scene: 'A census board in the town hall shows the figure 45,67,890. Meena points to the digit 5.',
        explanation: '45,67,890 is 45 lakh 67 thousand 890, so the 5 is in the lakhs place.',
      }),
      Q.short('Write the Roman numeral for 894.', 'DCCCXCIV', {
        accepted: ['DCCCXCIV', 'dcccxciv', 'DCCC XC IV'],
        scene: 'A museum plaque says a king ruled for 894 days. The curator wants the same number in Roman numerals.',
        rubric: '800 = DCCC, 90 = XC, 4 = IV → DCCCXCIV.',
      }),
      Q.mcq('Write 12,05,000 in the International system.', ['120,500', '1,205,000', '12,050,000', '120,500,000'], 1, {
        scene: 'A Mumbai export invoice shows 12,05,000 kg in the Indian style. A London buyer asks for the same figure with International commas.',
        explanation: '12 lakh 5 thousand = 1,205,000 (one million two hundred five thousand).',
      }),
      Q.mcq('Why is 49 written as XLIX and not IL in Roman numerals?', ['I can be subtracted only from V and X, not from L', 'L is not a Roman symbol', '49 has no Roman form', 'IL is the official form'], 0, {
        scene: 'A stone tablet restorer almost carves IL for year 49. The historian stops her.',
        explanation: 'The subtraction rule allows I only before V and X. 49 = 40 + 9 = XL + IX = XLIX.',
      }),
      Q.short('Estimate 4,567 + 3,210 by rounding each number to the nearest hundred, then add.', '7800', {
        accepted: ['7800', '7,800', '7800'],
        rubric: '4600 + 3200 = 7800.',
      }),
      Q.short('How many 6-digit numbers are there in all?', '900000', {
        accepted: ['900000', '9,00,000', '900,000'],
        scene: 'From the smallest 6-digit number 1,00,000 to the greatest 9,99,999, the class is asked how many such numbers exist.',
        rubric: '9,99,999 − 1,00,000 + 1 = 9,00,000.',
      }),
      Q.mcq('In the International system, 1,000,000 is called', ['one lakh', 'ten lakh', 'one million', 'one crore'], 2, {
        scene: 'Rahul sees 1,000,000 printed on a foreign newspaper. He wonders what Indians would call the same number.',
        explanation: '1,000,000 is one million (International) and ten lakh (Indian).',
      }),
      Q.short('A factory counter shows 9,99,999. What is the next reading, in the Indian system?', '1000000', {
        accepted: ['1000000', '10,00,000', '1,000,000', '1000000'],
        rubric: 'Successor of 9,99,999 is 10,00,000 (ten lakh).',
      }),
      Q.mcq('3,45,678 and 3,54,678 first differ at which place (Indian system)?', ['ones', 'thousands', 'ten thousands', 'lakhs'], 2, {
        scene: 'Two warehouse lots are stamped 3,45,678 and 3,54,678. The clerk must say which place-value digit decides the order.',
        explanation: 'Both start 3,xx,xxx. The ten-thousands digits are 4 and 5, so that place decides: 3,45,678 < 3,54,678.',
      }),
    ],
  }),
  activity({
    classNum: C, subject: 'Mathematics', chapterNum: 2, chapterTitle: 'Whole Numbers',
    slug: 'whole', name: 'Whole Number Properties', icon: '➕',
    description: 'Successor, predecessor, and closure, commutative, associative and identity properties of whole numbers.',
    questions: [
      Q.short('The predecessor of 1,000 is', '999', { accepted: ['999'], scene: 'A lift shows floor 1000. One floor down is the predecessor of 1000.' }),
      Q.mcq('The smallest whole number is', ['1', '0', '−1', '10'], 1, 'Whole numbers start at 0; natural numbers usually start at 1.'),
      Q.mcq('Whole numbers are closed under addition. That means', ['the sum of two whole numbers is always a whole number', 'you can only add even numbers', 'subtraction never leaves the set', 'every sum is zero'], 0, {
        scene: 'Aarav adds 17 + 8 on the board and gets 25. His teacher asks whether this will always stay inside the whole numbers.',
        explanation: 'Closure under addition: a + b is a whole number whenever a and b are.',
      }),
      Q.short('7 + 0 = 7 shows which property of 0?', 'identity', { accepted: ['identity', 'additive identity', 'additive identity of 0', 'identity property'] }),
      Q.mcq('Which is a whole number but not a natural number?', ['1', '2', '0', '5'], 2),
      Q.mcq('Which pair shows the commutative property of addition?', ['5 + 3 = 3 + 5', '5 × 0 = 0', '5 − 3 = 2', '(2 + 3) + 4 = 9'], 0),
      Q.short('The successor of 0 is', '1', { accepted: ['1'] }),
      Q.mcq('Whole numbers are not closed under subtraction because', ['5 − 8 is not a whole number', '5 + 8 is even', '0 has no successor', 'multiplication fails'], 0, {
        scene: 'Isha tries 5 − 8 on a number line of whole numbers and lands left of 0.',
        explanation: '5 − 8 = −3, which is not a whole number.',
      }),
      Q.short('Compute 12 × 1. What property of 1 does this show?', 'multiplicative identity', { accepted: ['multiplicative identity', 'identity', 'identity property', 'multiplicative identity of 1'] }),
      Q.mcq('(2 + 3) + 4 = 2 + (3 + 4) illustrates the', ['distributive property', 'associative property of addition', 'closure under division', 'identity of 1'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Mathematics', chapterNum: 3, chapterTitle: 'Playing with Numbers',
    slug: 'hcf-lcm', name: 'Divisibility, HCF & LCM', icon: '🧩',
    description: 'Divisibility rules, primes, prime factors, and HCF/LCM word problems.',
    questions: [
      Q.short('Find the HCF of 18 and 24.', '6', {
        accepted: ['6'],
        scene: 'Two ribbons are 18 cm and 24 cm. Mira wants the longest equal pieces that cut both exactly.',
        rubric: '18 = 2×3², 24 = 2³×3; HCF = 2×3 = 6.',
      }),
      Q.short('Smallest number of flowers for bunches of exactly 6 or exactly 8 with none left over?', '24', {
        accepted: ['24'],
        scene: 'A florist can tie bouquets of 6 roses or 8 roses. She wants the smallest stock that finishes in either size with no leftover flower.',
        rubric: 'LCM of 6 and 8 is 24.',
      }),
      Q.mcq('A number is divisible by 3 if', ['it ends with 0', 'the sum of its digits is divisible by 3', 'it is even', 'it ends with 5'], 1),
      Q.mcq('Which statement about 2 is correct?', ['2 is composite', '2 is the only even prime number', '2 is not prime', 'Every even number is prime'], 1, '2 is prime (only factors 1 and 2) and the only even prime.'),
      Q.short('LCM of 4 and 6 is', '12', { accepted: ['12'] }),
      Q.mcq('A number is divisible by 5 if it ends with', ['2 or 4', '0 or 5', '3 or 6', 'only 1'], 1),
      Q.mcq('The prime factorisation of 12 is', ['2 × 6', '3 × 4', '2 × 2 × 3', '12 × 1 only'], 2, {
        scene: 'Kabir writes factor trees for 12 until every branch is a prime.',
        explanation: '12 = 2 × 2 × 3 = 2² × 3.',
      }),
      Q.mcq('Co-prime numbers have HCF', ['0', '1', 'equal to their LCM', 'always even'], 1),
      Q.short('Is 153 divisible by 9? Write yes or no.', 'yes', {
        accepted: ['yes', 'Yes', 'YES'],
        rubric: '1+5+3=9, which is divisible by 9.',
      }),
      Q.mcq('A number divisible by both 2 and 3 is also divisible by', ['4', '5', '6', '8'], 2, {
        scene: 'Neha checks 72: it is even and 7+2=9, so it is divisible by 2 and by 3.',
        explanation: 'If a number is divisible by 2 and 3, it is divisible by 6 (LCM of 2 and 3).',
      }),
    ],
  }),
  activity({
    classNum: C, subject: 'Mathematics', chapterNum: 4, chapterTitle: 'Basic Geometrical Ideas',
    slug: 'geometry', name: 'Points, Lines & Shapes', icon: '📏',
    description: 'Identify point, line, ray, line segment, concurrent lines and simple polygons.',
    questions: [
      Q.mcq('I have exactly one endpoint and extend infinitely in one direction. I am a', ['point', 'line', 'ray', 'segment'], 2, {
        scene: 'A torch beam starts at the bulb and travels outward with no end that we can mark.',
        explanation: 'A ray has one endpoint and goes on forever in one direction.',
      }),
      Q.short('A hexagon has how many sides?', '6', { accepted: ['6', 'six'] }),
      Q.mcq('A line segment is best described as', ['infinite in both directions', 'a piece of a line with two endpoints', 'one endpoint only', 'a curved path'], 1, 'A line segment has two endpoints and a definite length.'),
      Q.mcq('Three or more lines meeting at one point are', ['parallel', 'concurrent', 'perpendicular', 'equal'], 1),
      Q.short('A closed shape with 5 sides is a', 'pentagon', { accepted: ['pentagon', 'Pentagon'] }),
      Q.mcq('Two lines in a plane that never meet are', ['intersecting', 'concurrent', 'parallel', 'a ray pair'], 2),
      Q.short('How many endpoints does a line have?', '0', {
        accepted: ['0', 'zero', 'none', 'no endpoints'],
        scene: 'The teacher draws a straight line across the board with arrows on both ends.',
        rubric: 'A line extends infinitely both ways, so it has no endpoints.',
      }),
      Q.mcq('An angle is formed by', ['two rays with a common endpoint', 'three parallel lines', 'one point only', 'a circle’s radius alone'], 0),
      Q.mcq('A triangle is a polygon with', ['2 sides', '3 sides', '4 sides', '6 sides'], 1, {
        scene: 'Rina traces a closed path with three straight sticks on the floor.',
        explanation: 'A triangle is a 3-sided polygon.',
      }),
      Q.short('The common endpoint of the two rays of an angle is called the', 'vertex', { accepted: ['vertex', 'Vertex'] }),
    ],
  }),
  activity({
    classNum: C, subject: 'Mathematics', chapterNum: 5, chapterTitle: 'Understanding Elementary Shapes',
    slug: 'shapes', name: 'Classify Shapes', icon: '🔺',
    description: 'Classify angles, triangles and quadrilaterals by sides and angle measures.',
    questions: [
      Q.mcq('A triangle with all sides equal is', ['scalene', 'isosceles', 'equilateral', 'right-angled only'], 2),
      Q.short('A right angle measures how many degrees?', '90', { accepted: ['90', '90°', '90 degrees'] }),
      Q.mcq('A rectangle always has', ['only one right angle', 'four right angles', 'no equal sides', 'three acute angles'], 1, {
        scene: 'A classroom door frame looks like a rectangle. Sana counts the corner angles with a protractor.',
        explanation: 'Each corner of a rectangle is 90°.',
      }),
      Q.mcq('Two lines that meet at 90° are', ['parallel', 'perpendicular', 'curved', 'skew and never meet in a plane'], 1),
      Q.short('An acute angle is less than how many degrees?', '90', { accepted: ['90', '90°', '90 degrees'] }),
      Q.mcq('A scalene triangle has', ['all sides equal', 'two sides equal', 'all sides of different lengths', 'all angles 90°'], 2),
      Q.mcq('An obtuse angle measures', ['exactly 90°', 'less than 90°', 'between 90° and 180°', 'exactly 180°'], 2, {
        scene: 'The hands of a clock at about 10:00 form an angle bigger than a corner of a book but less than a straight line.',
        explanation: 'Obtuse angles are greater than 90° and less than 180°.',
      }),
      Q.short('How many degrees is a straight angle?', '180', { accepted: ['180', '180°', '180 degrees'] }),
      Q.mcq('A square is a special rectangle because', ['it has no right angles', 'all four sides are equal and all angles are 90°', 'it has only three sides', 'its diagonals are unequal'], 1),
      Q.short('A triangle with one 90° angle is called a', 'right-angled triangle', {
        accepted: ['right-angled triangle', 'right triangle', 'right angled triangle', 'right-angled', 'right angle triangle'],
        scene: 'A set-square on the desk has one corner that matches the corner of the notebook.',
      }),
    ],
  }),
  activity({
    classNum: C, subject: 'Mathematics', chapterNum: 6, chapterTitle: 'Integers',
    slug: 'integers', name: 'Positive & Negative', icon: '➖',
    description: 'Integers on the number line, comparison, and simple addition and subtraction.',
    questions: [
      Q.short('The temperature is 5°C and falls by 8°C. What is the new temperature?', '-3', {
        accepted: ['-3', '−3', '-3°C', '−3°C', '-3 C'],
        scene: 'At dawn the school garden thermometer reads 5°C. By evening it has dropped 8 degrees.',
        rubric: '5 − 8 = −3.',
      }),
      Q.mcq('Which is smaller?', ['−2', '0', '3', '1'], 0, 'On the number line, numbers to the left are smaller. −2 is left of 0, 1 and 3.'),
      Q.short('The additive inverse of 7 is', '-7', { accepted: ['-7', '−7'] }),
      Q.mcq('On the number line, −15 compared with −4 is', ['to the right of −4', 'to the left of −4', 'at the same point', 'greater than 0'], 1, {
        scene: 'A winter chart marks −4°C in Delhi and −15°C in Leh.',
        explanation: '−15 is further left, so it is smaller than −4.',
      }),
      Q.short('Compute: −6 + 10', '4', { accepted: ['4', '+4'] }),
      Q.mcq('The integer just to the left of −3 is', ['−2', '−4', '0', '3'], 1),
      Q.mcq('Which set lists integers only?', ['1, 2, ½', '−3, 0, 4', '0.5, 1, 2', 'π, 2, 3'], 1),
      Q.short('Compute: 4 − 9', '-5', { accepted: ['-5', '−5'] }),
      Q.mcq('The opposite of −12 is', ['−12', '12', '0', '1/12'], 1, {
        scene: 'A lift goes 12 floors below ground (written −12). Going the same distance the other way from 0 is the opposite integer.',
        explanation: 'The additive inverse (opposite) of −12 is 12.',
      }),
      Q.mcq('Which is true?', ['−7 > −2', '−7 < −2', '−7 = −2', '−7 > 0'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Mathematics', chapterNum: 7, chapterTitle: 'Fractions',
    slug: 'fractions', name: 'Unlike Denominators', icon: '🍕',
    description: 'Compare, simplify and add fractions, including unlike denominators.',
    questions: [
      Q.short('Solve and simplify: 2/3 + 1/4', '11/12', {
        accepted: ['11/12', '11 / 12'],
        scene: 'A pizza is cut so Ravi eats 2/3 and later 1/4 of another equal pizza is left on a plate. How much pizza is that altogether?',
        rubric: 'LCM of 3 and 4 is 12: 8/12 + 3/12 = 11/12.',
      }),
      Q.mcq('Compare 3/4 and 2/3 by writing both with denominator 12. The larger fraction is', ['2/3', '3/4', 'they are equal', 'cannot say'], 1, '3/4 = 9/12 and 2/3 = 8/12, so 3/4 is larger.'),
      Q.short('5/10 in lowest terms is', '1/2', { accepted: ['1/2', '½', '1 / 2'] }),
      Q.mcq('A proper fraction is one that is', ['greater than 1', 'equal to 1', 'less than 1', 'always a whole number'], 2, {
        scene: 'Sana has 3 of 8 equal chocolate squares. 3/8 is less than a whole bar.',
        explanation: 'In a proper fraction the numerator is smaller than the denominator.',
      }),
      Q.short('What is 3/5 of 20?', '12', { accepted: ['12'] }),
      Q.mcq('Which pair are equivalent fractions?', ['1/2 and 2/4', '1/2 and 2/3', '2/3 and 3/2', '3/4 and 4/3'], 0),
      Q.mcq('An improper fraction is', ['3/5', '7/4', '1/8', '2/9'], 1),
      Q.short('Write 9/4 as a mixed number.', '2 1/4', {
        accepted: ['2 1/4', '2¼', '2 1 / 4', '9/4 = 2 1/4'],
        scene: 'Four friends share 9 equal sandwiches by quarters. How many whole sandwiches and leftover quarters is that?',
      }),
      Q.mcq('To add 1/6 and 1/3 first write 1/3 as', ['1/6', '2/6', '3/6', '1/9'], 1, {
        scene: 'A juice glass is 1/6 full; someone pours another 1/3. You need a common denominator.',
        explanation: '1/3 = 2/6, then 1/6 + 2/6 = 3/6 = 1/2.',
      }),
      Q.mcq('Which fraction lies between 0 and 1?', ['5/4', '3/2', '2/5', '7/3'], 2),
    ],
  }),
  activity({
    classNum: C, subject: 'Mathematics', chapterNum: 8, chapterTitle: 'Decimals',
    slug: 'decimals', name: 'Compare Decimals', icon: '🔟',
    description: 'Compare, add and place decimals; convert simple fractions and read place value.',
    questions: [
      Q.mcq('Which list is in ascending order?', ['2.3, 2.03, 2.003', '2.003, 2.03, 2.3', '2.03, 2.3, 2.003', '2.3, 2.003, 2.03'], 1, {
        scene: 'Three lab readings are 2.3 ml, 2.03 ml and 2.003 ml. The class must arrange them from smallest to largest.',
        explanation: '2.003 < 2.030 < 2.300, so 2.003, 2.03, 2.3.',
      }),
      Q.short('Add: 2.35 + 1.4', '3.75', { accepted: ['3.75'] }),
      Q.short('0.25 as a fraction in lowest terms is', '1/4', { accepted: ['1/4', '¼', '1 / 4'] }),
      Q.mcq('Which statement is correct?', ['0.70 is greater than 0.7', '0.70 is less than 0.7', '0.70 = 0.7', '0.70 = 70'], 2, 'Trailing zeros after the decimal do not change the value: 0.70 = 0.7.'),
      Q.mcq('The tenths digit in 14.86 is', ['1', '4', '8', '6'], 2),
      Q.mcq('The hundredths digit in 14.86 is', ['1', '4', '8', '6'], 3, {
        scene: 'A chemist’s scale shows 14.86 g. You must read tenths and hundredths separately.',
        explanation: '8 is tenths; 6 is hundredths.',
      }),
      Q.short('Subtract: 5.2 − 1.75', '3.45', { accepted: ['3.45'] }),
      Q.mcq('3/10 as a decimal is', ['0.03', '0.3', '3.0', '0.003'], 1),
      Q.short('Write 7/2 as a decimal.', '3.5', { accepted: ['3.5', '3.50'] }),
      Q.mcq('On a number line, 0.62 lies', ['between 0.6 and 0.7', 'between 0.5 and 0.6', 'to the left of 0', 'at 6.2'], 0, {
        scene: 'A number line is marked 0.6, 0.61, 0.62, … up to 0.7.',
        explanation: '0.62 is 2 hundredths more than 0.60.',
      }),
    ],
  }),
  activity({
    classNum: C, subject: 'Mathematics', chapterNum: 9, chapterTitle: 'Data Handling',
    slug: 'data', name: 'Pictographs & Bar Graphs', icon: '📊',
    description: 'Read pictographs, tally charts and bar graphs and use frequency and scale.',
    questions: [
      Q.short('One 🍎 = 4 students. Five apples mean how many students?', '20', {
        accepted: ['20'],
        scene: 'The class pictograph key says one apple drawing stands for 4 children who chose fruit at lunch. There are five apple drawings for Monday.',
      }),
      Q.mcq('The bar that is tallest on a bar graph shows the', ['smallest value', 'greatest value', 'average only', 'title'], 1),
      Q.mcq('A tally of 7 is shown as', ['seven separate lines only', 'one bundle of 5 plus two marks', 'one bundle of 10 minus 3', 'a single long bar'], 1, {
        scene: 'During a traffic survey, Tara counts 7 red cars. She uses the 5-bar tally method.',
        explanation: 'Tally marks group every five as four uprights and a diagonal.',
      }),
      Q.short('The number of times an item occurs is its', 'frequency', { accepted: ['frequency', 'Frequency'] }),
      Q.mcq('A pictograph needs a', ['key / scale', 'protractor', 'compass only', 'cube'], 0),
      Q.mcq('In a bar graph, the bars are usually', ['of unequal width and no gaps needed', 'of equal width with equal gaps', 'circles', 'always horizontal only'], 1),
      Q.short('Favourite sports: Cricket 12, Football 8, Kho-kho 5. How many students were asked in all?', '25', {
        accepted: ['25'],
        scene: 'A table on the board lists votes for three sports after a class poll.',
      }),
      Q.mcq('If one ⭐ = 10 books, then 3½ stars mean', ['13 books', '30 books', '35 books', '3 books'], 2),
      Q.short('In the sports poll (Cricket 12, Football 8, Kho-kho 5), which sport has the highest frequency? Write the name.', 'Cricket', { accepted: ['Cricket', 'cricket'] }),
      Q.mcq('Data organised in a table is easier to read because', ['it hides the numbers', 'it groups values so we can compare frequencies', 'it replaces graphs forever', 'it uses only Roman numerals'], 1, {
        scene: 'Raw votes are a messy list. The teacher makes columns: Sport | Tally | Number.',
        explanation: 'A frequency table organises raw data for graphs and comparison.',
      }),
    ],
  }),
  activity({
    classNum: C, subject: 'Mathematics', chapterNum: 10, chapterTitle: 'Mensuration',
    slug: 'mensuration', name: 'Perimeter & Area', icon: '📐',
    description: 'Perimeter and area of rectangles, squares and simple closed paths.',
    questions: [
      Q.short('Perimeter of a 12 cm by 7 cm rectangle.', '38', {
        accepted: ['38', '38 cm', '38cm'],
        scene: 'A photo frame is 12 cm long and 7 cm wide. You need ribbon for the outer edge.',
        rubric: '2 × (12 + 7) = 38 cm.',
      }),
      Q.short('Area of a square of side 9 cm.', '81', { accepted: ['81', '81 cm²', '81 sq cm', '81 cm2'] }),
      Q.mcq('Perimeter is measured in', ['square units only', 'cubic units only', 'units of length (cm, m, …)', 'degrees'], 2, 'Perimeter is a length; area uses square units.'),
      Q.short('Area of a rectangle = length × ____. Write the missing word.', 'breadth', { accepted: ['breadth', 'width', 'breadth or width'] }),
      Q.mcq('A square of perimeter 20 cm has side', ['4 cm', '5 cm', '10 cm', '20 cm'], 1),
      Q.mcq('Area of a 10 cm by 4 cm rectangle is', ['14 cm²', '40 cm²', '28 cm²', '8 cm²'], 1, {
        scene: 'A bookmark is 10 cm long and 4 cm wide. You need its paper area.',
        explanation: '10 × 4 = 40 cm².',
      }),
      Q.mcq('If you walk all around a 6 m square garden, the distance is', ['6 m', '12 m', '24 m', '36 m'], 2),
      Q.short('A square has area 64 cm². What is its side in cm?', '8', { accepted: ['8', '8 cm', '8cm'] }),
      Q.mcq('Which statement is true?', ['Two shapes with the same perimeter always have the same area', 'Perimeter is the boundary length; area is the space inside', 'Area is always larger than perimeter', 'Squares have no perimeter'], 1, {
        scene: 'A 1×6 rectangle and a 2×5 rectangle can have different areas but you still measure around the edge the same way.',
        explanation: 'Same perimeter does not force the same area.',
      }),
      Q.mcq('Units for area include', ['cm and m', 'cm² and m²', 'only kg', 'only litres'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Mathematics', chapterNum: 11, chapterTitle: 'Algebra',
    slug: 'algebra', name: 'Letters for Numbers', icon: '𝑥',
    description: 'Use variables to write expressions, matchstick rules and simple equations.',
    questions: [
      Q.short('Harsha has x rupees and spends 15. How much is left?', 'x-15', {
        accepted: ['x-15', 'x - 15', 'x−15', 'x – 15'],
        scene: 'Harsha’s pocket money is x rupees. She buys a notebook for ₹15.',
      }),
      Q.mcq("Matchsticks for letter 'A': 3 for the first. A rule for n letters is", ['n + 3', '3n', 'n/3', '3 − n'], 1, {
        scene: 'On the desk, one A uses 3 sticks, two A’s use 6, three use 9.',
        explanation: 'Each letter A needs 3 matchsticks, so n letters need 3n.',
      }),
      Q.short('If y + 7 = 12, then y =', '5', { accepted: ['5'] }),
      Q.mcq('A variable is a letter that', ['never changes', 'can take different values', 'is always 0', 'must be x only'], 1),
      Q.mcq('“5 more than a number p” is', ['5p', 'p − 5', 'p + 5', '5 − p'], 2),
      Q.mcq('The expression for “thrice a number m minus 2” is', ['3m − 2', '3 + m − 2', 'm/3 − 2', '2m − 3'], 0),
      Q.short('If 4n = 20, then n =', '5', { accepted: ['5'] }),
      Q.mcq('Which is an equation?', ['3x + 2', 'x − 7', '2x + 3 = 11', '5y'], 2, {
        scene: 'The teacher writes four things on the board; only one has an equals sign balancing two sides.',
        explanation: 'An equation states that two expressions are equal.',
      }),
      Q.short('Write an expression for the perimeter of a square of side s.', '4s', { accepted: ['4s', '4s', '4 × s', '4*s', '4 · s'] }),
      Q.mcq('If a = 3, the value of 2a + 1 is', ['6', '7', '5', '31'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Mathematics', chapterNum: 12, chapterTitle: 'Ratio and Proportion',
    slug: 'ratio', name: 'Ratio & Proportion', icon: '⚖️',
    description: 'Write ratios in lowest terms, check proportions and solve unitary-method problems.',
    questions: [
      Q.short('The ratio 8:12 in lowest terms is', '2:3', { accepted: ['2:3', '2 : 3', '2/3'] }),
      Q.mcq('2:5 = 4:10 is a proportion because', ['2 + 5 = 4 + 10', '2 × 10 = 5 × 4', '2 × 5 = 4 × 10', 'the numbers are even'], 1, {
        scene: 'A recipe uses 2 cups flour to 5 cups water. Doubling gives 4 cups flour to 10 cups water.',
        explanation: 'Cross products: 2 × 10 = 20 and 5 × 4 = 20.',
      }),
      Q.short('If 3 pens cost Rs 36, what is the cost of 5 pens?', '60', {
        accepted: ['60', 'Rs 60', '₹60', 'Rs. 60', '60 rupees'],
        scene: 'A stationery stall sells pens at a fixed rate. Three pens are ₹36; a student wants five.',
        rubric: '1 pen = ₹12, so 5 pens = ₹60.',
      }),
      Q.mcq('The ratio of 50 cm to 2 m is', ['50:2', '1:4', '4:1', '25:1'], 1, '2 m = 200 cm → 50:200 = 1:4.'),
      Q.short('In a:b = c:d, the product a×d equals', 'b×c', { accepted: ['b×c', 'b*c', 'bc', 'c×b', 'b x c', 'c*b'] }),
      Q.mcq('The ratio 15:25 simplified is', ['15:25', '3:5', '5:3', '1:2'], 1),
      Q.mcq('If 4:7 = x:21, then x is', ['12', '14', '16', '28'], 0, {
        scene: 'A map scale uses 4 cm for 7 km. How many centimetres show 21 km?',
        explanation: '4/7 = x/21 → x = 12.',
      }),
      Q.short('Divide 40 in the ratio 3:5. What is the smaller share?', '15', { accepted: ['15'] }),
      Q.mcq('Two quantities are in proportion when', ['their ratio is 1 always', 'they have the same ratio', 'they are both odd', 'their difference is zero'], 1),
      Q.mcq('The ratio of 2 hours to 30 minutes is', ['2:30', '4:1', '1:4', '2:1'], 1, '2 h = 120 min; 120:30 = 4:1.'),
    ],
  }),
  activity({
    classNum: C, subject: 'Mathematics', chapterNum: 13, chapterTitle: 'Symmetry',
    slug: 'symmetry', name: 'Lines of Symmetry', icon: '🦋',
    description: 'Count lines of symmetry in polygons and letters and use the idea of a mirror line.',
    questions: [
      Q.mcq('An equilateral triangle has how many lines of symmetry?', ['1', '2', '3', '0'], 2),
      Q.mcq('A scalene triangle has how many lines of symmetry?', ['3', '2', '1', '0'], 3, {
        scene: 'Three sticks of lengths 5 cm, 6 cm and 8 cm form a triangle. No side matches another.',
        explanation: 'A scalene triangle has no equal sides and no line of symmetry.',
      }),
      Q.short('A circle has how many lines of symmetry? Write infinite or a number.', 'infinite', { accepted: ['infinite', 'infinitely', 'infinitely many', 'unlimited', 'infinity'] }),
      Q.mcq('Which letter has a horizontal line of symmetry?', ['A', 'B', 'K', 'L'], 1),
      Q.mcq('Reflection symmetry is the same idea as', ['a mirror line', 'a rotation of 1° only', 'a translation only', 'changing size'], 0),
      Q.mcq('A square has how many lines of symmetry?', ['1', '2', '3', '4'], 3, {
        scene: 'Fold a square paper: two midlines and two diagonals all match the halves.',
        explanation: 'A square has 4 lines of symmetry.',
      }),
      Q.short('How many lines of symmetry does an isosceles triangle (exactly two sides equal) usually have?', '1', { accepted: ['1', 'one'] }),
      Q.mcq('Which capital letter has a vertical line of symmetry?', ['F', 'N', 'A', 'J'], 2),
      Q.short('A rectangle that is not a square has how many lines of symmetry?', '2', { accepted: ['2', 'two'] }),
      Q.mcq('The dotted fold that makes two halves match is called a', ['chord', 'line of symmetry', 'radius', 'diagonal only when curved'], 1, {
        scene: 'A butterfly drawing is folded along its body; the wings match.',
        explanation: 'That fold is a line (axis) of symmetry.',
      }),
    ],
  }),
  activity({
    classNum: C, subject: 'Mathematics', chapterNum: 14, chapterTitle: 'Practical Geometry',
    slug: 'constructions', name: 'Constructions', icon: '✏️',
    description: 'Use compass, ruler and protractor to construct lines, circles and angle copies.',
    questions: [
      Q.mcq('To draw a circle you need a', ['protractor only', 'compass', 'set square only', 'calculator'], 1),
      Q.mcq('A perpendicular bisector of a segment', ['cuts it into two equal parts at 90°', 'is always parallel to it', 'touches only one endpoint', 'has to be shorter than 1 cm'], 0, {
        scene: 'You open a compass more than half of AB, draw arcs from A and B, and join the crossings.',
        explanation: 'The perpendicular bisector meets the segment at its midpoint at right angles.',
      }),
      Q.short('We measure angles with a', 'protractor', { accepted: ['protractor', 'Protractor'] }),
      Q.mcq('The radius of a circle is', ['twice the diameter', 'half the diameter', 'equal to the circumference', 'always 1 cm'], 1),
      Q.mcq('To copy an angle exactly you should use', ['a ruler alone', 'a compass and ruler', 'only freehand sketching', 'an eraser only'], 1, 'A ruler alone cannot copy an angle’s opening; compass + ruler (or protractor) can.'),
      Q.short('The distance from the centre of a circle to a point on it is the', 'radius', { accepted: ['radius', 'Radius'] }),
      Q.mcq('A line perpendicular to a given line at a point on it makes an angle of', ['45°', '60°', '90°', '180°'], 2, {
        scene: 'From a point P on line l you construct a line standing “upright” on l.',
        explanation: 'Perpendicular means 90°.',
      }),
      Q.mcq('The instrument used to draw a long straight line is a', ['compass', 'ruler / scale', 'divider only', 'protractor only'], 1),
      Q.short('A complete turn around a point measures how many degrees?', '360', { accepted: ['360', '360°', '360 degrees'] }),
      Q.mcq('When you construct 60° with compass and ruler, you are really constructing', ['an equilateral triangle’s angle', 'a right angle first', 'a reflex angle', 'a circle’s diameter only'], 0, {
        scene: 'Two arcs of the same radius meet; joining the points makes an equilateral triangle.',
        explanation: 'Each angle of an equilateral triangle is 60°.',
      }),
    ],
  }),

  // ── Science ──────────────────────────────────────────────────
  activity({
    classNum: C, subject: 'Science', chapterNum: 1, chapterTitle: 'Components of Food',
    slug: 'nutrients', name: 'Nutrients & Tests', icon: '🥗',
    description: 'Nutrients, food tests (iodine–starch) and deficiency diseases.',
    questions: [
      Q.mcq('Iodine solution turns blue-black in the presence of', ['protein', 'fat', 'starch', 'vitamin C'], 2, {
        scene: 'In the lab, a drop of iodine falls on a slice of boiled potato. The spot turns blue-black.',
        explanation: 'Iodine is a test for starch.',
      }),
      Q.short('Scurvy is caused by a lack of which vitamin?', 'Vitamin C', { accepted: ['Vitamin C', 'vitamin C', 'C', 'ascorbic acid'] }),
      Q.mcq('Proteins mainly help the body to', ['store extra water only', 'build and repair tissues', 'carry iodine colour', 'block sunlight'], 1),
      Q.short('A diet that has all nutrients in the right amounts is called a', 'balanced diet', { accepted: ['balanced diet', 'balanced', 'a balanced diet'] }),
      Q.mcq('Which food is a good source of fats?', ['cucumber', 'ghee / nuts', 'salt', 'water'], 1),
      Q.mcq('Anaemia is linked to a deficiency of', ['iodine', 'iron', 'vitamin D only', 'fibre only'], 1, {
        scene: 'A doctor tells a tired student that the blood is not carrying enough oxygen, often from too little iron.',
        explanation: 'Iron is needed for haemoglobin; its lack can cause anaemia.',
      }),
      Q.short('Night blindness is linked to a lack of which vitamin?', 'Vitamin A', { accepted: ['Vitamin A', 'vitamin A', 'A', 'retinol'] }),
      Q.mcq('The copper sulphate and caustic soda test (with a violet colour) is used for', ['fats', 'proteins', 'starch', 'water'], 1),
      Q.mcq('Dietary fibres (roughage) help mainly to', ['colour the blood', 'move food through the gut', 'replace all proteins', 'store vitamins in fat only'], 1, {
        scene: 'A meal of whole grains and vegetables keeps the digestive tract working smoothly.',
        explanation: 'Fibre is not digested for energy but helps bowel movement.',
      }),
      Q.short('Name the nutrient that is the body’s main source of energy in a rice-and-roti meal.', 'carbohydrates', { accepted: ['carbohydrates', 'carbohydrate', 'carbs', 'starch'] }),
    ],
  }),
  activity({
    classNum: C, subject: 'Science', chapterNum: 2, chapterTitle: 'Sorting Materials into Groups',
    slug: 'materials', name: 'Sort the Materials', icon: '📦',
    description: 'Group materials as soluble/insoluble, transparent/opaque, hard/soft and lustrous.',
    questions: [
      Q.mcq('Wood is', ['transparent', 'translucent', 'opaque', 'invisible'], 2, {
        scene: 'You hold a wooden board in front of a lamp. No clear window of light comes through.',
        explanation: 'Opaque materials do not let light pass through.',
      }),
      Q.mcq('Sugar stirred into water', ['stays as grains at the bottom always', 'dissolves (is soluble)', 'turns the water into wood', 'becomes opaque metal'], 1),
      Q.short('Materials that allow light to pass clearly are called', 'transparent', { accepted: ['transparent', 'Transparent'] }),
      Q.mcq('Which is insoluble in water?', ['salt', 'sugar', 'sand', 'lemon juice'], 2),
      Q.mcq('Metals are generally', ['dull and powdery', 'hard and shiny (lustrous)', 'always liquid at room temperature', 'transparent like glass'], 1, {
        scene: 'A new steel spoon gleams; a wooden spoon does not shine in the same way.',
        explanation: 'Lustrous means shiny; most metals are hard and lustrous.',
      }),
      Q.short('Oiled paper that lets some light through, but not a clear view, is', 'translucent', { accepted: ['translucent', 'Translucent'] }),
      Q.mcq('Which object is hard compared with a sponge?', ['cotton wool', 'an iron nail', 'a foam pillow', 'a balloon'], 1),
      Q.mcq('Grouping materials helps us', ['waste more of them', 'study and use them more easily', 'stop all experiments', 'make them all metals'], 1),
      Q.short('A material that does not dissolve in water is called', 'insoluble', {
        accepted: ['insoluble', 'insoluble in water'],
        scene: 'Chalk powder is shaken in a glass of water. After rest, white powder still sits at the bottom.',
      }),
      Q.mcq('Glass window panes are useful because glass is mostly', ['opaque', 'transparent', 'magnetic', 'soluble in rain'], 1, {
        scene: 'Sunlight fills the classroom through the windows while the wooden door blocks the view.',
        explanation: 'Transparent glass lets light (and a clear view) through.',
      }),
    ],
  }),
  activity({
    classNum: C, subject: 'Science', chapterNum: 3, chapterTitle: 'Separation of Substances',
    slug: 'separation', name: 'Choose the Method', icon: '🌾',
    description: 'Choose threshing, winnowing, filtration, evaporation, sieving or handpicking for a mixture.',
    questions: [
      Q.mcq('Sand and water are best separated by', ['threshing', 'filtration', 'winnowing', 'handpicking only'], 1, {
        scene: 'After a garden experiment, a beaker holds muddy sand settled in water. The teacher points to a filter paper and funnel.',
        explanation: 'Filtration lets water through and holds back sand.',
      }),
      Q.mcq('Husk is removed from grain by', ['filtration', 'winnowing', 'evaporation', 'sieving metal'], 1),
      Q.mcq('Salt is obtained from sea water mainly by', ['winnowing', 'evaporation', 'handpicking crystals from waves', 'threshing'], 1, {
        scene: 'Shallow pans of sea water dry in the sun at a salt farm. White crystals remain.',
        explanation: 'Water evaporates; salt is left behind.',
      }),
      Q.short('Separating tea leaves from prepared tea uses a', 'strainer', { accepted: ['strainer', 'sieve', 'filter', 'tea strainer'] }),
      Q.mcq('Threshing is used to', ['filter muddy water', 'beat grain to separate it from stalks', 'evaporate salt', 'churn butter'], 1),
      Q.short('The method that uses wind to blow away lighter husk is', 'winnowing', { accepted: ['winnowing', 'Winnowing'] }),
      Q.mcq('Sieving is useful when particles', ['are all the same size', 'differ in size', 'are all dissolved', 'are only gases'], 1),
      Q.mcq('Handpicking works best when', ['the unwanted pieces look different and are few', 'everything is a solution', 'you need a magnet only', 'the mixture is steam'], 0, {
        scene: 'A plate of rice has a few small stones. You pick the stones out by hand.',
        explanation: 'Handpicking needs a visible difference and a small amount of impurity.',
      }),
      Q.short('Common salt dissolved in water can be recovered by', 'evaporation', { accepted: ['evaporation', 'heating / evaporation', 'evaporating the water'] }),
      Q.mcq('Churning cream separates', ['sand from water', 'butter from curd/cream', 'husks from grain by wind', 'iron from sand with a sieve only'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Science', chapterNum: 4, chapterTitle: 'Getting to Know Plants',
    slug: 'plants', name: 'Herbs, Shrubs & Roots', icon: '🌿',
    description: 'Herbs, shrubs and trees; tap vs fibrous roots; leaf veins and flower parts.',
    questions: [
      Q.short('A plant with a green, tender, weak stem is a', 'herb', {
        accepted: ['herb', 'Herb'],
        scene: 'Mint in a kitchen pot has a soft green stem you can pinch easily, unlike a woody rose bush.',
      }),
      Q.mcq('A tap root is found in', ['grass', 'wheat', 'mustard / mango seedling', 'onion'], 2),
      Q.mcq('Shrubs are typically', ['very tall trees with one thick trunk only', 'medium-sized plants with woody stems branching near the ground', 'plants with no stem', 'only water plants'], 1, {
        scene: 'In the school garden, a rose bush branches from near the soil and is shorter than the neem tree.',
        explanation: 'Shrubs are bushy, woody and of medium height.',
      }),
      Q.short('The colourful part of a flower that attracts insects is the', 'petal', { accepted: ['petal', 'petals'] }),
      Q.mcq('Veins in a leaf help to', ['transport water and food', 'make the leaf smell', 'only decorate it', 'produce seeds'], 0),
      Q.mcq('Fibrous roots are typical of', ['mango', 'mustard', 'grass and wheat', 'pea only'], 2),
      Q.short('The part of the stamen that holds pollen is the', 'anther', { accepted: ['anther', 'Anther'] }),
      Q.mcq('Parallel venation is seen in', ['a mango leaf', 'a grass leaf', 'a rose leaf', 'a peepal leaf'], 1, {
        scene: 'Hold a grass blade to the light: many veins run side by side from base to tip.',
        explanation: 'Monocots like grass show parallel venation.',
      }),
      Q.mcq('A tree usually has', ['a soft, green, short stem', 'a thick woody trunk', 'no roots', 'flowers but never leaves'], 1),
      Q.short('The female part of a flower (stigma, style, ovary) is the', 'pistil', { accepted: ['pistil', 'carpel', 'Pistil', 'gynoecium'] }),
    ],
  }),
  activity({
    classNum: C, subject: 'Science', chapterNum: 5, chapterTitle: 'Body Movements',
    slug: 'joints', name: 'Bones & Joints', icon: '🦴',
    description: 'Human joints (hinge, ball-and-socket, pivot) and how animals without a bony skeleton move.',
    questions: [
      Q.mcq('The human elbow is a', ['ball and socket joint', 'hinge joint', 'pivot joint', 'fixed joint'], 1, {
        scene: 'You bend your arm to lift a school bag. The elbow folds and unfolds like a door, not in a full circle.',
        explanation: 'A hinge joint allows movement mainly in one plane.',
      }),
      Q.mcq('The shoulder is a', ['hinge joint', 'ball and socket joint', 'gliding only', 'immovable joint'], 1),
      Q.mcq('Earthworms move using', ['a bony skeleton and wings', 'muscles and tiny bristles, not bones', 'only a hinge joint', 'fins and gills'], 1, {
        scene: 'After rain, an earthworm shortens and lengthens on the path. No bones show under the skin.',
        explanation: 'Earthworms use muscles and setae (bristles).',
      }),
      Q.short('The joint that allows the head to rotate on the neck is a', 'pivot', { accepted: ['pivot', 'pivot joint'] }),
      Q.mcq('Snails move using a', ['wing', 'muscular foot', 'fin only', 'jointed leg'], 1),
      Q.short('The framework of bones in our body is the', 'skeleton', { accepted: ['skeleton', 'skeletal system'] }),
      Q.mcq('The hip joint is a', ['hinge joint', 'ball and socket joint', 'fixed joint of the skull', 'pivot in the wrist only'], 1),
      Q.mcq('Bones of the skull (except the jaw) meet at', ['hinge joints', 'ball and socket joints', 'fixed / immovable joints', 'pivot joints only'], 2, {
        scene: 'A model skull shows plates locked together; only the lower jaw swings.',
        explanation: 'Most cranial bones are joined by immovable joints.',
      }),
      Q.short('Fish swim using body muscles and', 'fins', { accepted: ['fins', 'fin', 'tail fin', 'fins and tail'] }),
      Q.mcq('Cartilage is', ['harder than the hardest bone always', 'softer than bone and present at some joints', 'a type of blood', 'only found in plants'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Science', chapterNum: 6, chapterTitle: 'Motion and Measurement of Distances',
    slug: 'motion', name: 'Motion & SI Units', icon: '📏',
    description: 'Types of motion and SI length conversions (km, m, cm).',
    questions: [
      Q.short('Convert 4.5 kilometres into metres.', '4500', {
        accepted: ['4500', '4,500', '4500 m', '4 500'],
        scene: 'A milestone says the next village is 4.5 km away. You want the same distance in metres.',
        rubric: '1 km = 1000 m, so 4.5 × 1000 = 4500 m.',
      }),
      Q.mcq('The motion of a child on a swing is', ['rectilinear only', 'periodic', 'random only', 'not motion'], 1, {
        scene: 'On the playground a swing goes to and fro, repeating its path after equal times.',
        explanation: 'Motion that repeats at regular intervals is periodic (here also oscillatory).',
      }),
      Q.mcq('The SI unit of length is the', ['centimetre', 'metre', 'kilometre only', 'foot'], 1),
      Q.short('Motion along a straight line is called', 'rectilinear', { accepted: ['rectilinear', 'rectilinear motion', 'linear', 'linear motion'] }),
      Q.mcq('A spinning top shows', ['only rectilinear motion', 'rotational motion', 'no motion', 'only sound'], 1),
      Q.mcq('Which is suitable to measure the length of a curved thread?', ['a metre rod laid once in a straight line only', 'a thread that you then stretch along a scale', 'a clock', 'a thermometer'], 1),
      Q.short('How many centimetres are there in 1 metre?', '100', { accepted: ['100', '100 cm'] }),
      Q.mcq('The motion of a vehicle on a straight road is mainly', ['circular', 'rectilinear', 'periodic like a swing only', 'rotational only'], 1, {
        scene: 'A bus travels along a straight highway without turning.',
        explanation: 'Straight-line motion is rectilinear.',
      }),
      Q.mcq('An object is in motion if it', ['changes position with time relative to a reference', 'is always at rest', 'never changes place', 'has no speed'], 0),
      Q.short('The motion of the hands of a clock is an example of', 'periodic', { accepted: ['periodic', 'periodic motion', 'circular', 'circular and periodic'] }),
    ],
  }),
  activity({
    classNum: C, subject: 'Science', chapterNum: 7, chapterTitle: 'The Living Organisms — Characteristics and Habitats',
    slug: 'habitat', name: 'Living Things & Habitats', icon: '🦎',
    description: 'Life processes and adaptations of organisms to their habitats.',
    questions: [
      Q.mcq('A cactus lives in a', ['pond', 'desert', 'deep ocean', 'polar ice only'], 1, {
        scene: 'A plant with spines instead of broad leaves stores water in a thick stem under a hot, dry sky.',
        explanation: 'Cactus is adapted to a desert habitat.',
      }),
      Q.mcq('Living things typically', ['never grow', 'grow, respire and respond to stimuli', 'are only made of plastic', 'cannot reproduce'], 1),
      Q.short('The place where an organism lives is its', 'habitat', { accepted: ['habitat', 'Habitat'] }),
      Q.mcq('Fish have gills to', ['walk on land', 'breathe in water', 'fly', 'make nests'], 1),
      Q.mcq('A polar bear’s thick fur is', ['an adaptation to cold', 'used only for flying', 'proof it lives in a desert', 'unrelated to climate'], 0, {
        scene: 'In an Arctic photo, a polar bear’s dense coat keeps body heat in icy wind.',
        explanation: 'Thick fur is a cold-climate adaptation.',
      }),
      Q.short('Organisms that cannot make their own food and eat plants or animals are', 'heterotrophs', { accepted: ['heterotrophs', 'heterotroph', 'consumers', 'animals'] }),
      Q.mcq('A mountain goat’s strong hooves help it', ['swim in the deep sea', 'climb rocky slopes', 'photosynthesise', 'live only in deserts'], 1),
      Q.mcq('Respiration in living organisms is', ['only breathing in oxygen for some, but all release energy from food', 'the same as photosynthesis', 'found only in plants', 'a kind of habitat'], 0),
      Q.short('The surroundings that affect an organism, together with other living things, make its', 'environment', {
        accepted: ['environment', 'Environment'],
        scene: 'A pond has water, mud, sunlight, fish, insects and weeds all interacting.',
      }),
      Q.mcq('Biotic components of a habitat include', ['rocks and air only', 'plants and animals', 'only temperature', 'only soil minerals'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Science', chapterNum: 8, chapterTitle: 'Water',
    slug: 'water-cycle', name: 'Water Cycle & Drought', icon: '💧',
    description: 'States of water, the water cycle, floods, drought and careful use of groundwater.',
    questions: [
      Q.mcq('Water changing to vapour is', ['freezing', 'evaporation', 'condensation only', 'melting'], 1, {
        scene: 'A wet school courtyard dries in the afternoon sun though nobody mops it.',
        explanation: 'Liquid water becomes vapour by evaporation.',
      }),
      Q.mcq('Clouds form when water vapour', ['freezes into rocks', 'condenses into tiny droplets', 'turns into oxygen', 'disappears forever'], 1),
      Q.short('A long period with little or no rain is a', 'drought', { accepted: ['drought', 'Drought'] }),
      Q.mcq('Floods can happen when', ['there is no rain for years', 'heavy rain and rivers overflow', 'all taps are closed', 'deserts expand overnight'], 1),
      Q.mcq('Groundwater should be used carefully because', ['it refills instantly no matter how much we pump', 'it is limited and recharges slowly', 'it is not water', 'rain never reaches the ground'], 1, {
        scene: 'A village well goes deeper each summer as more motors run.',
        explanation: 'Aquifers recharge slowly; overuse causes shortage.',
      }),
      Q.short('The continuous movement of water from earth to air and back is the', 'water cycle', { accepted: ['water cycle', 'hydrological cycle', 'the water cycle'] }),
      Q.mcq('Ice is water in the', ['gaseous state', 'liquid state', 'solid state', 'plasma state'], 2),
      Q.mcq('Rainwater harvesting means', ['wasting rain in drains on purpose', 'collecting and storing rain for later use', 'stopping all clouds', 'using only bottled water'], 1, {
        scene: 'Pipes from a roof lead rain into a tank beside the house.',
        explanation: 'Harvesting stores rain instead of letting it all run off.',
      }),
      Q.short('Water vapour changing to liquid on a cold glass is', 'condensation', { accepted: ['condensation', 'Condensation'] }),
      Q.mcq('Transpiration is the loss of water from', ['only oceans', 'plant leaves as vapour', 'melting glaciers only', 'underground rocks as lava'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Science', chapterNum: 9, chapterTitle: 'Light, Shadows and Reflections',
    slug: 'light', name: 'Light & Shadows', icon: '💡',
    description: 'Luminous and non-luminous objects, shadows, transparent materials and mirrors.',
    questions: [
      Q.mcq('A shadow forms when an opaque object', ['gives out light', 'blocks light', 'melts', 'makes sound'], 1, {
        scene: 'At assembly, a student stands in the sun and a dark shape appears on the ground behind her.',
        explanation: 'Opaque objects block light and cast shadows.',
      }),
      Q.mcq('The moon is', ['a star that makes its own light', 'a non-luminous object that reflects sunlight', 'always luminous like the sun', 'a planet that burns'], 1),
      Q.short('A polished surface that forms a clear image is a', 'mirror', { accepted: ['mirror', 'plane mirror', 'Mirror'] }),
      Q.mcq('A transparent object', ['blocks all light', 'lets most light through', 'is always metal', 'makes no shadow ever if huge'], 1),
      Q.mcq('A pinhole camera can form', ['only a coloured painting', 'an inverted image of a bright object such as the sun', 'sound waves', 'magnets'], 1, {
        scene: 'A cardboard box with a tiny hole throws a small upside-down sun-spot onto the back screen.',
        explanation: 'Light travels in straight lines, so the image is inverted.',
      }),
      Q.short('Objects that give out their own light are called', 'luminous', { accepted: ['luminous', 'luminous objects'] }),
      Q.mcq('Shadows are shortest when the sun is', ['near the horizon', 'overhead around noon', 'not shining at all', 'blocked by a mirror only'], 1),
      Q.mcq('A plane mirror image is', ['inverted top-to-bottom always as in a pinhole', 'laterally inverted (left–right)', 'smaller always', 'coloured red always'], 1),
      Q.short('Light is observed to travel in a', 'straight line', {
        accepted: ['straight line', 'straight lines', 'rectilinear path'],
        scene: 'Sunlight slips through a hole in the curtain as a thin beam you can see in dusty air.',
      }),
      Q.mcq('Which is translucent?', ['clear glass', 'wood', 'frosted glass / oiled paper', 'a thick iron sheet'], 2),
    ],
  }),
  activity({
    classNum: C, subject: 'Science', chapterNum: 10, chapterTitle: 'Electricity and Circuits',
    slug: 'circuits', name: 'Will the Bulb Glow?', icon: '🔋',
    description: 'Open and closed circuits; conductors and insulators around a cell and bulb.',
    questions: [
      Q.mcq('If you replace copper wire with a plastic string, the bulb will', ['glow brighter', 'not glow, because plastic is an insulator', 'explode', 'glow only at night'], 1, {
        scene: 'In a simple cell–bulb kit, a student swaps the metal wire for a plastic binding string.',
        explanation: 'Plastic does not allow current, so the circuit stays incomplete for electricity.',
      }),
      Q.mcq('Current flows when the path is', ['open (broken)', 'closed (complete)', 'made of only rubber', 'missing a cell forever'], 1),
      Q.short('Materials that allow current to pass are', 'conductors', { accepted: ['conductors', 'conductor', 'good conductors'] }),
      Q.mcq('Which is an insulator?', ['copper', 'aluminium', 'rubber', 'iron'], 2),
      Q.mcq('A cell has', ['two positive terminals only', 'a positive and a negative terminal', 'no terminals', 'only a switch'], 1, {
        scene: 'A torch cell is marked + at the cap and − at the base.',
        explanation: 'Electric cells have two terminals of opposite polarity.',
      }),
      Q.short('A material that does not allow current to pass easily is an', 'insulator', { accepted: ['insulator', 'insulators'] }),
      Q.mcq('A switch is used to', ['open or close a circuit', 'make plastic conduct', 'replace the cell with water', 'measure mass'], 0),
      Q.mcq('The bulb glows if', ['only one terminal of the cell is joined', 'both terminals connect through a conductor and the filament', 'the wires are cut', 'the holder is plastic only with no metal'], 1, {
        scene: 'When both clips touch the bulb holder and the cell, the filament lights.',
        explanation: 'A closed conducting loop through the filament is needed.',
      }),
      Q.short('The thin wire inside a bulb that glows is the', 'filament', { accepted: ['filament', 'Filament'] }),
      Q.mcq('Which set are all conductors?', ['rubber, plastic, wood', 'copper, aluminium, iron', 'glass, cork, ceramic', 'wool, paper, rubber'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Science', chapterNum: 11, chapterTitle: 'Fun with Magnets',
    slug: 'magnets', name: 'Poles & Attraction', icon: '🧲',
    description: 'Magnetic poles, attraction and repulsion, compasses and magnetic materials.',
    questions: [
      Q.mcq('A freely hanging magnet comes to rest in the', ['east–west direction', 'north–south direction', 'up–down only', 'random direction always'], 1, {
        scene: 'A bar magnet hung from a thread slowly settles with one end pointing toward the north of the playground.',
        explanation: 'A freely suspended magnet aligns roughly north–south.',
      }),
      Q.mcq('Like poles of two magnets', ['attract', 'repel', 'disappear', 'become copper'], 1),
      Q.short('The ends of a magnet are called', 'poles', { accepted: ['poles', 'magnetic poles', 'north and south poles'] }),
      Q.mcq('Which is attracted by a magnet?', ['wood', 'plastic', 'iron nail', 'rubber band'], 2),
      Q.mcq('A compass needle is', ['a piece of wood', 'a small magnet', 'an insulator wire', 'a plastic string'], 1, {
        scene: 'Scouts open a compass: the painted needle swings and then points north.',
        explanation: 'The needle is a magnetised pointer.',
      }),
      Q.short('Opposite poles of two magnets', 'attract', { accepted: ['attract', 'attraction', 'attract each other'] }),
      Q.mcq('Which is a magnetic material?', ['nickel', 'paper', 'glass', 'plastic comb'], 0),
      Q.mcq('If you cut a bar magnet in half you get', ['one north piece and one south piece with no poles', 'two smaller magnets, each with both poles', 'no magnetism', 'only a south pole'], 1),
      Q.short('The pole that points toward the geographic north is the magnet’s', 'north pole', {
        accepted: ['north pole', 'north', 'N-pole', 'north-seeking pole'],
        scene: 'The end of the hanging magnet that faces the Earth’s north is painted red in the kit.',
      }),
      Q.mcq('Magnets can lose strength if', ['stored in pairs with keepers as taught', 'heated strongly, dropped or hammered', 'kept away from phones only', 'used as a compass once'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Science', chapterNum: 12, chapterTitle: 'Air Around Us',
    slug: 'air', name: 'What’s in Air?', icon: '🌬️',
    description: 'Air as a mixture, oxygen, carbon dioxide, the atmosphere and wind.',
    questions: [
      Q.mcq('The gas we need to breathe is', ['nitrogen only', 'oxygen', 'carbon dioxide only', 'argon only'], 1, {
        scene: 'After running, you breathe faster. The body is taking in the gas used to release energy from food.',
        explanation: 'Oxygen is essential for respiration in humans.',
      }),
      Q.mcq('Air is', ['a single pure gas', 'a mixture of gases', 'only water vapour', 'empty space with no matter'], 1),
      Q.short('The envelope of air around the Earth is the', 'atmosphere', { accepted: ['atmosphere', 'Atmosphere'] }),
      Q.mcq('Plants take in carbon dioxide and give out', ['only nitrogen', 'oxygen (in photosynthesis)', 'smoke', 'ozone only'], 1),
      Q.mcq('Wind is', ['still air', 'moving air', 'liquid water', 'a kind of soil'], 1, {
        scene: 'Clothes on a line flap when the air starts to move.',
        explanation: 'Moving air is called wind.',
      }),
      Q.short('The gas that makes up the largest part of air is', 'nitrogen', { accepted: ['nitrogen', 'Nitrogen', 'N2'] }),
      Q.mcq('Air supports burning because it contains', ['only nitrogen', 'oxygen', 'only dust', 'argon alone'], 1),
      Q.mcq('Water vapour in air is shown when', ['a cold bottle “sweats” with droplets', 'iron becomes wood', 'magnets point south only', 'sand dissolves'], 0, {
        scene: 'You take a chilled water bottle from the fridge. Tiny drops form on the outside.',
        explanation: 'Water vapour from air condenses on the cold surface.',
      }),
      Q.short('Tiny moving animals and dust in air show that air also contains', 'dust and microbes', { accepted: ['dust', 'dust particles', 'dust and microbes', 'smoke and dust', 'impurities'] }),
      Q.mcq('We must not burn plastic in the open because smoke', ['purifies air', 'adds harmful gases to the air we breathe', 'makes more oxygen', 'removes nitrogen usefully'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Science', chapterNum: 13, chapterTitle: 'Garbage In, Garbage Out',
    slug: 'waste', name: 'Waste Wise', icon: '♻️',
    description: 'Biodegradable waste, compost, vermicompost and the 3 Rs.',
    questions: [
      Q.mcq('Vegetable peels should go into', ['a landfill mixed with glass', 'compost / green waste', 'the drain', 'a burning plastic pile'], 1, {
        scene: 'After lunch, potato and banana peels sit in a bucket. A gardener says they can become manure.',
        explanation: 'Kitchen peels are biodegradable and suit compost.',
      }),
      Q.mcq('Plastic bags in a few days', ['rot like leaves', 'do not biodegrade quickly', 'turn into compost', 'become oxygen'], 1),
      Q.short('The 3 Rs are Reduce, Reuse and', 'Recycle', { accepted: ['Recycle', 'recycle', 'Recycling'] }),
      Q.mcq('A red earthworm is useful in a compost pit because it', ['eats plastic bags', 'helps turn waste into manure', 'produces petrol', 'chases rats only'], 1),
      Q.mcq('Burning plastic in the open is', ['safe for air and lungs', 'harmful to air and health', 'the best 3 R', 'required by compost'], 1, {
        scene: 'Black smoke rises from a heap of packets at the street corner. Neighbours cough.',
        explanation: 'Burning plastic releases toxic fumes.',
      }),
      Q.short('Waste that can be broken down by microbes is called', 'biodegradable', { accepted: ['biodegradable', 'biodegradable waste'] }),
      Q.mcq('Which is a good example of reuse?', ['throwing a jar after one use', 'using a jam jar to store spices', 'burning the jar', 'burying plastic with peels'], 1),
      Q.mcq('Landfills overflow when we', ['compost and recycle more', 'throw mixed waste without reducing it', 'use cloth bags', 'repair toys'], 1),
      Q.short('Manure made with the help of earthworms is called', 'vermicompost', {
        accepted: ['vermicompost', 'vermi compost', 'vermicomposting'],
        scene: 'Red worms wriggle through moist kitchen waste in a shady pit and leave dark crumbly manure.',
      }),
      Q.mcq('A cloth bag instead of a thin plastic bag is an example of', ['increase and burn', 'reduce (and reuse)', 'only landfill', 'wasting more plastic'], 1),
    ],
  }),

  // ── Social Science (History → Geography → Civics, in sequence) ──
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 1, chapterTitle: 'What, Where, How and When? (History)',
    slug: 'sources', name: 'Manuscripts & Inscriptions', icon: '📜',
    description: 'Manuscripts vs inscriptions, BC/AD dating, and early sources such as the Rigveda.',
    questions: [
      Q.short('What is the difference between a manuscript and an inscription?', 'Manuscripts are handwritten on palm leaf or paper; inscriptions are carved on stone or metal', {
        accepted: [
          'Manuscripts are handwritten on palm leaf or paper; inscriptions are carved on stone or metal',
          'manuscript handwritten; inscription carved',
          'Manuscripts written by hand on leaf/paper; inscriptions engraved on stone/metal',
        ],
        scene: 'In a museum, one case holds a palm-leaf book in ink. Another shows letters cut into a stone pillar.',
        rubric: 'Manuscripts = handwritten on leaf/paper; inscriptions = engraved on hard surfaces.',
      }),
      Q.mcq('Which animal was among the first tamed by early humans?', ['horse', 'dog', 'elephant', 'camel'], 1),
      Q.mcq('BC dates', ['count forward from today only', 'count backward from the start of the Common Era / birth of Jesus in this system', 'are the same as AD years', 'are used only for weather'], 1, {
        scene: 'A timeline in the textbook marks 2500 BC to the left of year 1, then AD years to the right.',
        explanation: 'In the BC–AD system, BC years run backward from that starting point.',
      }),
      Q.short('The study of the past is called', 'history', { accepted: ['history', 'History'] }),
      Q.mcq('The Rigveda is an example of a', ['modern newspaper', 'old religious text / source', 'stone tool only', 'map of Europe'], 1),
      Q.mcq('People who study old objects from digs are', ['astronomers', 'archaeologists', 'pilots', 'grocers'], 1),
      Q.short('Along which river did some of the earliest cities in the subcontinent grow?', 'Indus', {
        accepted: ['Indus', 'Indus river', 'Sindhu', 'Indus (Sindhu)'],
        scene: 'A map shows early cities beside a river that flows to the Arabian Sea — the Indus.',
      }),
      Q.mcq('Manuscripts in the past were often written on', ['plastic sheets', 'palm leaf or birch bark', 'only computer screens', 'rubber stamps'], 1, {
        scene: 'A librarian wears gloves to turn fragile leaf pages that were copied by hand centuries ago.',
        explanation: 'Palm leaf and birch bark were common writing surfaces.',
      }),
      Q.mcq('The word “India” is linked in the chapter to the river', ['Nile', 'Indus / Sindhu', 'Amazon', 'Thames'], 1),
      Q.short('Carved writing on a hard surface is an', 'inscription', { accepted: ['inscription', 'inscriptions'] }),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 2, chapterTitle: 'From Gathering to Growing Food (History)',
    slug: 'farming', name: 'First Farmers', icon: '🌾',
    description: 'Domestication, herding, early farming sites such as Mehrgarh, and settled life.',
    questions: [
      Q.mcq('Growing plants and rearing animals on purpose is', ['hunting only', 'domestication / farming', 'mining', 'trading silk'], 1, {
        scene: 'Instead of only chasing wild goats, a family keeps a small herd near huts and sows grain beside the stream.',
        explanation: 'Domestication means taming plants and animals for human use.',
      }),
      Q.mcq('Mehrgarh is important because it is', ['a modern capital city', 'an early farming site in the subcontinent', 'a port in Kerala only', 'Ashoka’s palace'], 1),
      Q.short('People who move with herds are called', 'herders', { accepted: ['herders', 'pastoralists', 'nomads', 'nomadic herders'] }),
      Q.mcq('A stone tool used to grind grain is a', ['ploughshare of iron', 'mortar and pestle / quern', 'cannon', 'compass'], 1),
      Q.mcq('Farming meant people could', ['never stay in one place', 'stay in one place for longer', 'stop eating plants', 'live only in caves forever'], 1, {
        scene: 'Grain stores and mud houses appear once fields need tending through the seasons.',
        explanation: 'Crops encouraged more settled life.',
      }),
      Q.short('Taming plants and animals for human use is called', 'domestication', { accepted: ['domestication', 'Domestication'] }),
      Q.mcq('Early farmers in the north-west grew crops such as', ['only rubber', 'wheat and barley', 'cocoa only', 'pineapples only'], 1),
      Q.mcq('Pit-houses at Burzahom (Kashmir) suggest people', ['never felt cold', 'adapted to a cold climate by digging into the ground', 'lived only on boats', 'used iron rails'], 1, {
        scene: 'Archaeologists find house floors cut into the earth, useful when winters are harsh.',
        explanation: 'Pit-houses are linked with cold Kashmir at Burzahom.',
      }),
      Q.short('Name one animal that was domesticated in the early farming period (besides the dog).', 'sheep', { accepted: ['sheep', 'goat', 'cattle', 'cow', 'ox', 'buffalo', 'pig'] }),
      Q.mcq('A “tribe” in this chapter often means', ['only a modern political party', 'a group sharing customs, language and often kinship', 'a type of coin', 'a Roman numeral'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 3, chapterTitle: 'In the Earliest Cities (History)',
    slug: 'harappa', name: 'Harappan Cities', icon: '🏙️',
    description: 'Harappan town planning, crafts, the Great Bath, weights and the unread script.',
    questions: [
      Q.mcq('Harappan cities are famous for', ['no drains', 'planned streets and drainage', 'iron railways', 'paper money'], 1, {
        scene: 'A reconstructed street shows straight roads and covered drains running beside brick houses.',
        explanation: 'Planned streets and an advanced drainage system are Harappan hallmarks.',
      }),
      Q.mcq('The Great Bath was found at', ['Pataliputra', 'Mohenjo-daro', 'Madurai', 'Kannauj'], 1),
      Q.short('Harappan weights were often made of a stone called', 'chert', { accepted: ['chert', 'Chert'] }),
      Q.mcq('A typical Harappan house had', ['no bathroom ever', 'a courtyard and rooms, often a well', 'only tents', 'glass skyscrapers'], 1),
      Q.mcq('The Harappan script is', ['fully read like modern Hindi', 'still not fully deciphered', 'only numbers 1–9', 'the same as English'], 1, {
        scene: 'Tiny seals show animal pictures and signs nobody can yet read as a complete language.',
        explanation: 'The script remains undeciphered.',
      }),
      Q.short('The civilisation is often named after the first city excavated,', 'Harappa', { accepted: ['Harappa', 'Harappan', 'the Harappan civilisation'] }),
      Q.mcq('Harappan crafts included', ['only plastic toys', 'bead-making, pottery and metal work', 'printing newspapers', 'building aeroplanes'], 1),
      Q.mcq('Many scholars think the civilisation declined partly because of', ['too many computers', 'rivers changing course, floods or drying, and other stresses', 'a lack of bricks', 'the arrival of the printing press'], 1, {
        scene: 'Later layers show cities shrinking; some rivers that watered fields may have shifted.',
        explanation: 'Environmental and river changes are among the suggested reasons.',
      }),
      Q.short('What material were most Harappan buildings made of?', 'baked bricks', { accepted: ['baked bricks', 'bricks', 'burnt bricks', 'mud bricks'] }),
      Q.mcq('The citadel in a Harappan city was', ['the lower town’s market only', 'the higher, often walled part with special buildings', 'a forest camp', 'a Greek theatre'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 4, chapterTitle: 'What Books and Burials Tell Us (History)',
    slug: 'vedas', name: 'Vedas & Burials', icon: '📖',
    description: 'The Rigveda, social groups, megaliths and what grave goods can reveal.',
    questions: [
      Q.mcq('The oldest Veda is the', ['Samaveda', 'Rigveda', 'Atharvaveda', 'Yajurveda'], 1, {
        scene: 'Priests recite hymns that were first composed and remembered, then written much later — the Rigveda is the earliest collection.',
        explanation: 'The Rigveda is the oldest of the four Vedas.',
      }),
      Q.mcq('Megaliths are', ['tiny clay beads only', 'large stone arrangements, often marking burials', 'Ashoka’s edicts in Greek only', 'modern dams'], 1),
      Q.short('Inaras and dasas are groups mentioned in the', 'Rigveda', { accepted: ['Rigveda', 'the Rigveda', 'Vedas', 'Veda'] }),
      Q.mcq('Objects buried with a person can tell us about', ['tomorrow’s weather only', 'their status and beliefs', 'the price of petrol', 'computer code'], 1),
      Q.mcq('In megalithic burials, goods in graves', ['were always exactly the same for everyone', 'sometimes differed, suggesting status differences', 'never included pots', 'were only paper notes'], 1, {
        scene: 'One grave has many pots and ornaments; another nearby has very few.',
        explanation: 'Unequal grave goods hint at social differences.',
      }),
      Q.short('Hymns of the Rigveda were composed in', 'Sanskrit', { accepted: ['Sanskrit', 'Vedic Sanskrit', 'old Sanskrit'] }),
      Q.mcq('The rajas in the Rigveda', ['collected regular taxes like later kings always', 'were leaders who did not yet rule big kingdoms with officials', 'lived only in Harappa', 'printed coins of steel'], 1),
      Q.mcq('Inamgaon is known for', ['a space station', 'an ancient settlement with burials studied by archaeologists', 'Ashoka’s war', 'the Prime Meridian'], 1, {
        scene: 'Excavations in Maharashtra show houses and burials that help us imagine life after the Harappan cities.',
        explanation: 'Inamgaon is a well-studied Chalcolithic site.',
      }),
      Q.short('A family of languages that includes Sanskrit, Hindi and many European tongues is called', 'Indo-European', { accepted: ['Indo-European', 'indo-european', 'Indo European'] }),
      Q.mcq('Charaka and later medical texts show that', ['people never thought about health', 'some scholars studied the human body and medicine', 'only farming existed', 'writing was unknown'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 5, chapterTitle: 'Kingdoms, Kings and an Early Republic (History)',
    slug: 'mahajanapadas', name: 'Janapadas & Magadha', icon: '👑',
    description: 'Varna, taxes, mahajanapadas, Magadha’s rise, and the idea of a gana or sangha.',
    questions: [
      Q.mcq('Magadha became powerful partly because of', ['no rivers', 'iron, forests and the Ganga plains', 'deserts only', 'being an island'], 1, {
        scene: 'A map of the lower Ganga shows forests for elephants, iron-rich hills and fertile floodplains around Magadha.',
        explanation: 'Rivers, iron, timber and elephants helped Magadha grow.',
      }),
      Q.mcq('A gana or sangha was ruled by', ['one king alone always', 'a group of leaders, not one king alone', 'only foreign traders', 'a single priest with no assembly'], 1),
      Q.short('Ashvamedha was a sacrifice involving which animal?', 'horse', { accepted: ['horse', 'a horse', 'the horse'] }),
      Q.mcq('Farmers paid taxes often as a share of', ['iron tools', 'the crop', 'poems', 'ships'], 1),
      Q.mcq('Varna was', ['a type of coin only', 'a social classification mentioned in later Vedic texts', 'a river in Magadha', 'Ashoka’s capital'], 1, {
        scene: 'Later texts list brahmins, kshatriyas, vaishyas and shudras as varnas with different duties.',
        explanation: 'Varna is a hereditary social division described in later Vedic literature.',
      }),
      Q.short('The “great kingdoms” of this period are called', 'mahajanapadas', { accepted: ['mahajanapadas', 'mahajanapada', 'maha janapadas'] }),
      Q.mcq('The capital of Magadha that later became famous was', ['Mohenjo-daro', 'Rajagriha / Rajgir (and later Pataliputra)', 'Madurai only', 'Delhi'], 1),
      Q.mcq('Painted Grey Ware is', ['modern plastic', 'a fine pottery found at some janapada sites', 'Ashoka’s pillar stone', 'a type of tax'], 1, {
        scene: 'Archaeologists lift grey bowls with painted designs from a northern settlement of this age.',
        explanation: 'PGW is linked with later Vedic / janapada settlements in the Ganga–Yamuna region.',
      }),
      Q.short('Vajji, with its capital at Vaishali, is an example of a', 'gana/sangha', { accepted: ['gana', 'sangha', 'gana/sangha', 'gana or sangha', 'republic', 'oligarchy'] }),
      Q.mcq('Regular armies and officials became possible when', ['nobody farmed', 'rulers collected taxes more regularly', 'the Harappan script was read', 'iron disappeared'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 6, chapterTitle: 'New Questions and Ideas (History)',
    slug: 'buddha', name: 'Buddha & Mahavira', icon: '☸️',
    description: 'The Buddha, Mahavira, Upanishads, ahimsa and the sangha.',
    questions: [
      Q.mcq('The Buddha taught that people should follow the', ['eightfold path to end suffering', 'only one king’s orders', 'hunting of all animals', 'building of only forts'], 0, {
        scene: 'Under a tree at Bodh Gaya, Siddhartha seeks why people suffer and how craving can end.',
        explanation: 'The Eightfold Path is central to the Buddha’s teaching.',
      }),
      Q.mcq('Mahavira taught ahimsa, which means', ['collecting more taxes', 'not harming living beings', 'building stupas only', 'writing edicts in Greek'], 1),
      Q.short('The Buddhist community of monks and nuns is the', 'sangha', { accepted: ['sangha', 'Sangha', 'the sangha'] }),
      Q.mcq('Upanishads are texts that discuss', ['only cooking recipes', 'the atman and the brahman, and life’s questions', 'only war lists', 'modern physics'], 1),
      Q.mcq('Both Buddhism and Jainism', ['encouraged animal sacrifice', 'questioned animal sacrifice', 'banned all trade', 'started in Europe'], 1, {
        scene: 'Thinkers of the sixth–fifth centuries BCE ask whether killing animals in yajnas is the only path.',
        explanation: 'Both traditions emphasised non-violence toward living beings.',
      }),
      Q.short('Siddhartha Gautama is better known as the', 'Buddha', { accepted: ['Buddha', 'the Buddha', 'Gautama Buddha'] }),
      Q.mcq('Jain monks were taught to', ['live in luxury palaces only', 'lead simple lives and practise non-violence', 'become Magadha’s army', 'ignore truth-speaking'], 1),
      Q.mcq('The Buddha belonged by birth to a', ['Harappan merchant family only', 'gana (the Shakyas) in the Himalayan foothills', 'Greek colony', 'Chola navy'], 1, {
        scene: 'Kapilavastu’s Shakya clan raises a prince who later leaves home to seek answers.',
        explanation: 'The Shakyas were a gana in the Himalayan foothills.',
      }),
      Q.short('The idea of a lasting “self” discussed in the Upanishads is the', 'atman', { accepted: ['atman', 'Atman', 'atma'] }),
      Q.mcq('A vihara is', ['a fort for elephants only', 'a monastery where monks lived', 'a type of coin', 'a river tax'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 7, chapterTitle: 'Ashoka, The Emperor Who Gave Up War (History)',
    slug: 'ashoka', name: 'Ashoka After Kalinga', icon: '🦁',
    description: 'The Mauryan empire, the Kalinga war, rock edicts and dhamma.',
    questions: [
      Q.mcq('Ashoka gave up conquest after the war in', ['Kalinga', 'Britain', 'China', 'Egypt'], 0, {
        scene: 'After a bloody campaign on the east coast, the emperor writes that he was filled with sorrow at the suffering.',
        explanation: 'The Kalinga war changed Ashoka’s policy toward dhamma instead of further conquest.',
      }),
      Q.mcq('Ashoka’s edicts were written on', ['only paper books', 'rocks and pillars', 'plastic boards', 'only palm leaves in Tibet'], 1),
      Q.short('Ashoka’s idea of duty and kindness is called', 'dhamma', { accepted: ['dhamma', 'dharma', 'Ashoka’s dhamma'] }),
      Q.mcq('The Mauryan capital was', ['Pataliputra', 'Madurai', 'Delhi', 'Mumbai'], 0),
      Q.mcq('Ashoka sent messengers of dhamma', ['only inside one village', 'beyond his empire as well', 'only to the Moon', 'never outside Magadha'], 1, {
        scene: 'Envoys carry the emperor’s message of respect and non-injury to neighbouring lands.',
        explanation: 'Ashoka claimed to send dhamma missions abroad.',
      }),
      Q.short('Who founded the Mauryan empire before Ashoka?', 'Chandragupta Maurya', { accepted: ['Chandragupta', 'Chandragupta Maurya', 'Chandragupta Maurya'] }),
      Q.mcq('Megasthenes was', ['Ashoka’s elephant', 'a Greek ambassador who wrote about Pataliputra', 'a Harappan priest', 'a Chola admiral'], 1),
      Q.mcq('Dhamma included ideas such as', ['more animal sacrifice and war', 'respect for elders, kindness and religious tolerance', 'only collecting gold', 'banning all roads'], 1, {
        scene: 'Pillars tell people not to quarrel about religions and to be gentle to servants and animals.',
        explanation: 'Ashoka’s dhamma stressed ethics more than a single ritual path.',
      }),
      Q.short('The lion capital of an Ashokan pillar at Sarnath is now India’s', 'national emblem', { accepted: ['national emblem', 'emblem', 'state emblem', 'National Emblem'] }),
      Q.mcq('The Mauryan empire was founded around', ['the time of the first farmers only', 'the fourth–third centuries BCE', '1857 CE', 'the Gupta age only'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 8, chapterTitle: 'Vital Villages, Thriving Towns (History)',
    slug: 'towns', name: 'Iron, Crafts & Towns', icon: '🏺',
    description: 'Iron tools, irrigation, crafts, punch-marked coins, shrenis and early historic towns.',
    questions: [
      Q.mcq('The use of iron tools helped farmers', ['stop growing food', 'clear forests and till land more easily', 'build aeroplanes', 'print books'], 1, {
        scene: 'An iron ploughshare bites into hard soil that wooden tools struggled to open.',
        explanation: 'Iron made clearing and tilling more effective.',
      }),
      Q.mcq('Punch-marked coins were', ['never used in India', 'used in early historic India', 'only plastic tokens', 'Ashoka’s paper notes'], 1),
      Q.short('A person who makes pots is a', 'potter', { accepted: ['potter', 'Potter', 'a potter'] }),
      Q.mcq('Mathura was important as a', ['port in Kerala only', 'crossroads city and religious centre', 'desert with no people', 'modern IT park'], 1),
      Q.mcq('Shrenis were', ['fort walls', 'associations of craftspersons and merchants', 'only Vedic hymns', 'types of megaliths'], 1, {
        scene: 'Weavers or traders in a town form a group that sets rules and helps members.',
        explanation: 'A shreni is a guild of craftspeople or merchants.',
      }),
      Q.short('Irrigation devices such as the waterwheel helped to water', 'fields', { accepted: ['fields', 'farms', 'crops', 'the fields'] }),
      Q.mcq('Northern Black Polished Ware is', ['a shiny pottery of early historic towns', 'a type of iron sword', 'Ashoka’s dhamma', 'a river'], 0),
      Q.mcq('Arikamedu on the east coast shows', ['no trade at all', 'trade with the Roman world (amphorae, beads)', 'only ice houses', 'the Prime Meridian'], 1, {
        scene: 'Digs near Puducherry uncover Roman amphora jars and bead workshops.',
        explanation: 'Arikamedu was a port linked to long-distance trade.',
      }),
      Q.short('Small silver coins with symbols punched on them are called', 'punch-marked coins', { accepted: ['punch-marked coins', 'punch marked coins', 'punch-marked coin'] }),
      Q.mcq('Gramabhojaka in many villages was', ['the village headman, often a large landholder', 'a Roman sailor', 'the Buddha’s horse', 'a type of drain'], 0),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 9, chapterTitle: 'Traders, Kings and Pilgrims (History)',
    slug: 'silk', name: 'Silk Route & Bhakti', icon: '🧵',
    description: 'Silk Route trade, South Indian kingdoms, Chinese pilgrims and early bhakti.',
    questions: [
      Q.mcq('The Silk Route connected', ['only two Indian villages', 'Asia with distant lands for silk and other goods', 'the Moon to Earth', 'only rivers'], 1, {
        scene: 'Caravans carry silk, spices and stories across mountains and deserts between China and the west.',
        explanation: 'The Silk Routes were long-distance trade networks.',
      }),
      Q.mcq('Xuan Zang (Hiuen Tsang) was', ['a Mauryan general', 'a Chinese pilgrim who visited India', 'a Chola sailor only', 'Ashoka’s minister'], 1),
      Q.short('Bhakti is a path of ____ to a personal god.', 'devotion', { accepted: ['devotion', 'love', 'loving devotion'] }),
      Q.mcq('South Indian kingdoms that traded overseas included the', ['Cholas, Cheras and Pandyas', 'Inuit only', 'Mauryas in Britain', 'Mughals in 200 BCE'], 0),
      Q.mcq('Traders carried', ['only gold bars and nothing else', 'goods and also ideas (including religions)', 'only ice', 'only modern passports'], 1, {
        scene: 'A monastery appears beside a caravan halt; monks and merchants share the same road.',
        explanation: 'Buddhism and other ideas travelled with trade.',
      }),
      Q.short('The Chinese pilgrim who came in the fifth century and wrote about India was', 'Fa Xian', { accepted: ['Fa Xian', 'Faxian', 'Fa-Hien', 'Fa Hien'] }),
      Q.mcq('The Kushanas are linked with', ['controlling parts of the Silk Route and issuing gold coins', 'building only Harappa', 'the first farmers', 'Panchayati Raj'], 0),
      Q.mcq('Bodhisattvas in later Buddhism are', ['only tax officers', 'compassionate beings who help others attain enlightenment', 'iron ploughs', 'Greek coins'], 1, {
        scene: 'A sculpture shows a gentle figure who delays final nirvana to help suffering people.',
        explanation: 'Bodhisattvas are central to Mahayana ideals.',
      }),
      Q.short('Pepper from the south was so prized in Rome it was called black', 'gold', { accepted: ['gold', 'black gold'] }),
      Q.mcq('Early bhakti poets stressed', ['only caste pride', 'a loving personal bond with God, often beyond rigid ritual', 'conquest of Kalinga', 'Roman law'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 10, chapterTitle: 'New Empires and Kingdoms (History)',
    slug: 'gupta', name: 'Guptas & Assemblies', icon: '🏛️',
    description: 'Samudragupta, Harshavardhana, prashastis, land grants and southern assemblies.',
    questions: [
      Q.mcq('The Allahabad pillar inscription praises', ['Akbar', 'Samudragupta', 'Ashoka only', 'Tipu Sultan'], 1, {
        scene: 'Harishena’s prashasti on a pillar lists kings whom Samudragupta defeated or who paid him homage.',
        explanation: 'The Prayaga (Allahabad) prashasti is about Samudragupta.',
      }),
      Q.mcq('Harshavardhana ruled from Kannauj in the', ['Harappan age', 'seventh century', 'year 2000', 'Mauryan century only'], 1),
      Q.short('The sabha in the Chola period was an assembly of', 'brahmins', { accepted: ['brahmins', 'Brahmanas', 'brahmanas', 'Brahmin landowners'] }),
      Q.mcq('Prashastis are', ['love poems only', 'inscriptions that praise a ruler', 'farm tools', 'coins of gold only'], 1),
      Q.mcq('Land grants to brahmins are often recorded on', ['plastic cards', 'copper plates', 'only newspapers', 'rubber stamps'], 1, {
        scene: 'A set of inscribed copper sheets records a village given to learned brahmanas.',
        explanation: 'Copper-plate grants are a key source for this period.',
      }),
      Q.short('Kalidasa lived in the age often linked with the', 'Guptas', { accepted: ['Guptas', 'Gupta', 'Gupta period', 'Gupta age'] }),
      Q.mcq('The ur in South India was', ['a type of silk', 'a village assembly of ordinary peasants', 'Harsha’s capital', 'a Chinese pilgrim'], 1),
      Q.mcq('Samantas were', ['always slaves with no land', 'military chiefs or local lords who could grow powerful', 'only potters', 'Ashokan lions'], 1, {
        scene: 'A king rewards a chief with land; later that chief’s family acts almost independently.',
        explanation: 'Samantas were subordinate rulers who might become a threat.',
      }),
      Q.short('Fa Xian and Xuan Zang visited India during or after the time of which famous northern king of Kannauj?', 'Harsha', { accepted: ['Harsha', 'Harshavardhana', 'Harshavardhan'] }),
      Q.mcq('Genealogies in prashastis', ['never mention ancestors', 'list a ruler’s family to claim status', 'are only weather reports', 'replace all coins'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 11, chapterTitle: 'Buildings, Paintings and Books (History)',
    slug: 'art', name: 'Stupas, Temples & Books', icon: '🛕',
    description: 'Stupas, the Iron Pillar, Ajanta paintings, epics and Sanskrit literature.',
    questions: [
      Q.mcq('A stupa is a mound that often holds', ['a railway station', 'relics of the Buddha', 'only grain', 'a well'], 1, {
        scene: 'Devotees walk around a hemispherical mound that enshrines relics, with a railing and gateway carvings.',
        explanation: 'Stupas are Buddhist relic mounds.',
      }),
      Q.mcq('The Iron Pillar at Mehrauli is famous for', ['melting every year', 'resisting rust for centuries', 'being made of wood', 'being Ashoka’s only edict'], 1),
      Q.short('The Ajanta caves are famous for their', 'paintings', { accepted: ['paintings', 'murals', 'frescoes', 'wall paintings'] }),
      Q.mcq('The Mahabharata and the Ramayana are', ['modern novels', 'ancient epics', 'science textbooks', 'newspapers'], 1),
      Q.mcq('Kalidasa wrote', ['only computer manuals', 'Sanskrit plays and poems', 'Ashoka’s rock edicts in Prakrit only', 'English novels'], 1, {
        scene: 'A court poet stages a play about a king who forgets a forest maiden — Kalidasa’s world of Sanskrit drama.',
        explanation: 'Kalidasa is the classic Sanskrit poet-dramatist (e.g. Abhijnanashakuntalam).',
      }),
      Q.short('The towering part of a temple that often houses the deity is the', 'shikhara', { accepted: ['shikhara', 'shikara', 'vimana', 'tower'] }),
      Q.mcq('The Silappadikaram is', ['a Tamil epic', 'a Harappan seal', 'a Gupta coin only', 'a Chinese travelogue'], 0),
      Q.mcq('Ordinary people often paid for buildings by', ['printing money', 'gifts of money, labour or goods recorded in inscriptions', 'using only Roman gold always', 'never contributing'], 1, {
        scene: 'A railing inscription names a merchant’s wife who paid for one section of a stupa.',
        explanation: 'Donative inscriptions show popular patronage.',
      }),
      Q.short('The Puranas are texts that include stories about', 'gods and kings', { accepted: ['gods', 'gods and kings', 'deities', 'Hindu gods', 'gods, kings and the world'] }),
      Q.mcq('A garbhagriha is', ['the inner shrine of a temple', 'a type of plough', 'Ashoka’s army camp', 'a Silk Route inn'], 0),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 12, chapterTitle: 'The Earth in the Solar System (Geography)',
    slug: 'solar', name: 'Planets & Stars', icon: '🪐',
    description: 'Stars, planets, the solar system and why Earth is called the blue planet.',
    questions: [
      Q.mcq('The planet known as the “blue planet” is', ['Mars', 'Earth', 'Venus', 'Saturn'], 1, {
        scene: 'From space, large oceans make our world look blue — unlike the rusty look of Mars.',
        explanation: 'Earth is called the blue planet because of its water.',
      }),
      Q.mcq('Stars produce their own heat and light; planets', ['also always do', 'do not; they reflect the Sun’s light', 'are all bigger than the Sun', 'never orbit anything'], 1),
      Q.short('The natural satellite of the Earth is the', 'Moon', { accepted: ['Moon', 'moon', 'the Moon'] }),
      Q.mcq('The Sun is a', ['planet', 'star', 'comet', 'asteroid'], 1),
      Q.mcq('The planet closest to the Sun is', ['Earth', 'Mars', 'Mercury', 'Neptune'], 2, {
        scene: 'A classroom model places a small grey ball nearest the lamp that stands for the Sun.',
        explanation: 'Mercury is the innermost planet.',
      }),
      Q.short('A group of stars forming a recognisable pattern is a', 'constellation', { accepted: ['constellation', 'Constellation'] }),
      Q.mcq('The solar system includes', ['only Earth and the Moon', 'the Sun, planets, satellites, asteroids and comets', 'only stars outside our galaxy', 'only the Pole Star'], 1),
      Q.mcq('Venus is often called', ['the red planet', 'the morning or evening star (though it is a planet)', 'a moon of Jupiter', 'the farthest planet'], 1, {
        scene: 'Just after sunset a bright “star” shines in the west — it is Venus reflecting sunlight.',
        explanation: 'Venus is a planet, seen as the morning/evening “star”.',
      }),
      Q.short('Mars is known as the ____ planet because of its colour.', 'red', { accepted: ['red', 'Red'] }),
      Q.mcq('The Pole Star is useful because it', ['moves all over the sky each minute', 'stays nearly fixed in the north (from the northern hemisphere)', 'is a planet', 'gives Earth its water'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 13, chapterTitle: 'Globe: Latitudes and Longitudes (Geography)',
    slug: 'globe', name: 'Latitudes & Longitudes', icon: '🌐',
    description: 'Equator, poles, tropics, meridians, Greenwich and time.',
    questions: [
      Q.mcq('The Equator is a', ['longitude of 180°', '0° latitude', 'the Prime Meridian', 'the Tropic of Capricorn'], 1, {
        scene: 'A globe has a belt painted around its fattest middle — 0° latitude.',
        explanation: 'The Equator is 0° latitude.',
      }),
      Q.mcq('All meridians are', ['of unequal length', 'of equal length', 'the same as the Equator', 'only in the south'], 1),
      Q.short('The Prime Meridian passes through', 'Greenwich', { accepted: ['Greenwich', 'London', 'Greenwich (London)', 'Greenwich, London'] }),
      Q.mcq('The Arctic Circle is in the', ['southern hemisphere only', 'northern hemisphere', 'on the Equator', 'on Mars'], 1),
      Q.mcq('Longitude helps us calculate', ['only rainfall', 'time differences', 'the height of mountains only', 'soil colour'], 1, {
        scene: 'When it is noon on the Prime Meridian, places 15° east are about one hour ahead.',
        explanation: 'Each 15° of longitude is roughly one hour of time.',
      }),
      Q.short('The 0° longitude line is the', 'Prime Meridian', { accepted: ['Prime Meridian', 'prime meridian', 'Greenwich Meridian'] }),
      Q.mcq('The Tropic of Cancer is at about', ['0°', '23½° N', '66½° S', '90° S'], 1),
      Q.mcq('Latitudes are', ['imaginary circles parallel to the Equator', 'lines from pole to pole only', 'real painted roads', 'the same as meridians'], 0, {
        scene: 'On the globe, the tropics and polar circles run east–west like stacked hoops.',
        explanation: 'Parallels of latitude circle the Earth east–west.',
      }),
      Q.short('How many time zones of one hour would circle the Earth if each is 15° of longitude?', '24', { accepted: ['24', 'twenty-four'] }),
      Q.mcq('The two poles are at', ['0° latitude', '90° N and 90° S', '180° latitude', '23½° only'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 14, chapterTitle: 'Motions of the Earth (Geography)',
    slug: 'motions', name: 'Rotation & Revolution', icon: '🌍',
    description: 'Rotation, revolution, day and night, seasons and leap year.',
    questions: [
      Q.mcq('Day and night are caused by the Earth’s', ['revolution', 'rotation', 'earthquakes', 'moon’s phases only'], 1, {
        scene: 'A lamp is the Sun. Spin the globe: one side is lit, the other is in shadow — day and night.',
        explanation: 'Rotation on the axis gives day and night.',
      }),
      Q.mcq('Seasons are caused mainly by', ['only the Moon’s shape', 'revolution plus the tilt of the Earth’s axis', 'earthquakes', 'ocean names'], 1),
      Q.short('A leap year has how many days?', '366', { accepted: ['366', '366 days'] }),
      Q.mcq('The Earth takes about 365¼ days to', ['rotate once', 'revolve around the Sun', 'reach the Moon', 'stop spinning'], 1),
      Q.mcq('When the North Pole tilts towards the Sun, the northern hemisphere has', ['winter', 'summer', 'no sunlight ever', 'only night'], 1, {
        scene: 'In June the North Pole leans sunward; days are long in India and short in Australia.',
        explanation: 'Tilt toward the Sun means summer in that hemisphere.',
      }),
      Q.short('The spinning of the Earth on its axis is', 'rotation', { accepted: ['rotation', 'Rotation'] }),
      Q.mcq('One rotation of the Earth takes about', ['24 hours', '365 days', '1 month', '7 days'], 0),
      Q.mcq('The Earth’s axis is tilted at about', ['0°', '23½°', '90° to the orbit meaning no tilt effect', '180°'], 1, {
        scene: 'A classroom globe is mounted at a slant, not upright, matching the real axis tilt.',
        explanation: 'The axis is inclined about 23½° from the vertical to the orbital plane.',
      }),
      Q.short('The movement of the Earth around the Sun is', 'revolution', { accepted: ['revolution', 'Revolution', 'orbital revolution'] }),
      Q.mcq('Equinoxes are days when', ['only the South Pole has night for months', 'day and night are nearly equal worldwide', 'Earth stops rotating', 'there is no Moon'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 15, chapterTitle: 'Maps (Geography)',
    slug: 'maps', name: 'Sketch, Plan & Scale', icon: '🗺️',
    description: 'Scale, directions, sketches vs plans, and types of maps.',
    questions: [
      Q.mcq('Distance on a map is shown by the', ['north arrow only', 'scale', 'colour of oceans only', 'title font'], 1, {
        scene: 'A legend says 1 cm on the paper equals 10 km on the ground.',
        explanation: 'Scale relates map distance to actual distance.',
      }),
      Q.mcq('A sketch is', ['always as accurate as a surveyed map', 'a rough drawing without an accurate scale', 'only a globe', 'a type of mountain'], 1),
      Q.short('The four cardinal directions are N, S, E and', 'W', { accepted: ['W', 'West', 'west', 'W (West)'] }),
      Q.mcq('A political map mainly shows', ['rainfall', 'countries and states', 'crops', 'mountains only'], 1),
      Q.mcq('Blue on many maps stands for', ['forests', 'water bodies', 'deserts', 'cities only'], 1, {
        scene: 'The atlas page paints seas and lakes in shades of blue.',
        explanation: 'Blue commonly represents water.',
      }),
      Q.short('A drawing of a small area like a room, with measurements, is a', 'plan', { accepted: ['plan', 'a plan', 'Plan'] }),
      Q.mcq('Intermediate directions include', ['only North', 'NE, SE, SW, NW', 'up and down only', 'the Equator'], 1),
      Q.mcq('A physical map emphasises', ['boundaries of states mainly', 'relief — mountains, plains, rivers', 'only language', 'election results'], 1, {
        scene: 'Browns and greens show height; blue lines trace rivers across the land.',
        explanation: 'Physical maps show natural features.',
      }),
      Q.short('The arrow on a map that shows north is the', 'north arrow', { accepted: ['north arrow', 'north line', 'direction indicator', 'north'] }),
      Q.mcq('Without a scale, a map', ['still gives exact distances always', 'cannot give accurate distances', 'becomes a globe', 'shows only time zones'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 16, chapterTitle: 'Major Domains of the Earth (Geography)',
    slug: 'domains', name: 'Lithosphere to Biosphere', icon: '🌏',
    description: 'Lithosphere, hydrosphere, atmosphere, biosphere, continents and oceans.',
    questions: [
      Q.mcq('The solid rocky crust is the', ['hydrosphere', 'lithosphere', 'atmosphere', 'biosphere only'], 1, {
        scene: 'Mountains, plains and the ocean floor are all part of Earth’s solid outer shell.',
        explanation: 'The lithosphere is the rocky domain.',
      }),
      Q.short('All water on Earth together is the', 'hydrosphere', { accepted: ['hydrosphere', 'Hydrosphere'] }),
      Q.mcq('The biosphere is where', ['only rocks exist', 'land, water and air meet and support life', 'no living thing can exist', 'only the Moon’s dust lies'], 1),
      Q.mcq('The largest continent is', ['Africa', 'Asia', 'Europe', 'Australia'], 1),
      Q.mcq('The largest ocean is the', ['Indian', 'Atlantic', 'Arctic', 'Pacific'], 3, {
        scene: 'On a world map the widest stretch of blue between Asia/Australia and the Americas is the Pacific.',
        explanation: 'The Pacific is the largest ocean.',
      }),
      Q.short('The thin blanket of air around Earth is the', 'atmosphere', { accepted: ['atmosphere', 'Atmosphere'] }),
      Q.mcq('There are how many major continents conventionally taught here?', ['5', '7', '3', '12'], 1),
      Q.mcq('The Indian Ocean is the only ocean named after a', ['star', 'country', 'poet', 'planet'], 1, {
        scene: 'South of India the sea bears the country’s name on the atlas.',
        explanation: 'The Indian Ocean is named after India.',
      }),
      Q.short('The narrow zone of life on Earth is the', 'biosphere', { accepted: ['biosphere', 'Biosphere'] }),
      Q.mcq('Continents and oceans together make up the Earth’s', ['only atmosphere', 'major surface domains of land and water', 'inner core only', 'Moon’s crust'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 17, chapterTitle: 'Major Landforms of the Earth (Geography)',
    slug: 'landforms', name: 'Mountains, Plateaus, Plains', icon: '⛰️',
    description: 'Mountains, plateaus, plains, rivers and tributaries and why plains attract settlement.',
    questions: [
      Q.short('A large body of water that flows through a channel on land is a', 'river', {
        accepted: ['river', 'River'],
        scene: 'From the hills a stream grows wider, carving a channel toward the sea.',
      }),
      Q.short('Smaller streams that join a main river are its', 'tributaries', { accepted: ['tributaries', 'tributary'] }),
      Q.mcq('Plateaus are often rich in', ['only ice', 'minerals', 'no soil ever', 'oil wells in every village'], 1, {
        scene: 'Miners work on a flat-topped upland where ore deposits are common.',
        explanation: 'Many plateaus have rich mineral deposits.',
      }),
      Q.mcq('Plains are generally', ['useless for farming', 'good for farming and settlement', 'always icy peaks', 'only ocean floors'], 1),
      Q.mcq('Young fold mountains include the', ['Aravallis only as the youngest', 'Himalayas', 'Deccan as a fold range', 'Nilgiris as ocean ridges'], 1),
      Q.mcq('Internal forces (like earth movements) can', ['only make rain', 'build mountains and plateaus', 'stop all rivers', 'create only maps'], 1, {
        scene: 'Slow crumpling of the crust raises a chain of fold mountains.',
        explanation: 'Endogenic forces create many large landforms.',
      }),
      Q.short('A flat-topped highland with steep sides is a', 'plateau', { accepted: ['plateau', 'Plateau', 'tableland'] }),
      Q.mcq('External forces such as running water', ['never change land', 'wear down and shape the land (erosion)', 'only build fold mountains', 'create the atmosphere'], 1),
      Q.mcq('People settle densely on plains because of', ['no water ever', 'fertile soil, flat land and easier transport', 'only steep cliffs', 'permanent ice'], 1, {
        scene: 'Villages and cities line a wide river plain with farms on both banks.',
        explanation: 'Plains offer soil, water and easier building.',
      }),
      Q.short('The Himalayas were formed by the folding of the Earth’s', 'crust', { accepted: ['crust', 'crustal plates', 'lithosphere', 'plates'] }),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 18, chapterTitle: 'Our Country — India (Geography)',
    slug: 'india', name: 'India: Location & Neighbours', icon: '🇮🇳',
    description: 'India’s hemisphere, Tropic of Cancer, neighbours and major physical divisions.',
    questions: [
      Q.mcq('India lies in the', ['southern hemisphere only', 'northern hemisphere', 'Arctic Circle', 'western hemisphere only'], 1, {
        scene: 'On the globe, the whole of India sits north of the Equator.',
        explanation: 'India is in the northern hemisphere.',
      }),
      Q.mcq('The Tropic of Cancer', ['misses India entirely', 'passes through India', 'is the southern boundary of Tamil Nadu', 'is a river'], 1),
      Q.short('The southern neighbours across the sea include Sri Lanka and', 'Maldives', { accepted: ['Maldives', 'the Maldives', 'Maldive'] }),
      Q.mcq('The Himalayas lie to the', ['south of India', 'north of India', 'west only as a desert', 'centre of the Deccan'], 1),
      Q.mcq('India has land borders with countries including', ['only Australia', 'Pakistan, China and Bangladesh (among others)', 'only Brazil', 'only Iceland'], 1, {
        scene: 'A political map shows neighbours along the north and east land frontiers.',
        explanation: 'India shares land borders with several countries, including those named.',
      }),
      Q.short('The southern tip of the Indian mainland is', 'Kanyakumari', { accepted: ['Kanyakumari', 'Cape Comorin', 'Kanniyakumari'] }),
      Q.mcq('The Deccan is a', ['fold mountain of the newest type', 'plateau in peninsular India', 'desert in the far north only', 'coral island'], 1),
      Q.mcq('Lakshadweep islands lie in the', ['Bay of Bengal', 'Arabian Sea', 'Arctic Ocean', 'Pacific'], 1, {
        scene: 'Tiny coral islands appear off India’s south-west coast in the Arabian Sea.',
        explanation: 'Lakshadweep is in the Arabian Sea.',
      }),
      Q.short('The Andaman and Nicobar Islands lie in the', 'Bay of Bengal', { accepted: ['Bay of Bengal', 'the Bay of Bengal', 'Bay Of Bengal'] }),
      Q.mcq('India’s standard meridian (82°30′ E) helps to', ['set a single official time for the country', 'mark the Equator', 'name the Pacific', 'measure rainfall only'], 0),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 19, chapterTitle: 'India: Climate, Vegetation and Wildlife (Geography)',
    slug: 'climate', name: 'Seasons & Wildlife', icon: '🐅',
    description: 'Monsoon, natural vegetation, wildlife and why forests and animals need protection.',
    questions: [
      Q.mcq('Most of India’s rainfall comes from the', ['western disturbance only', 'southwest monsoon', 'polar night', 'desert wind only'], 1, {
        scene: 'From June, moist winds from the Indian Ocean bring the main rainy season to much of India.',
        explanation: 'The southwest monsoon gives most of India’s rain.',
      }),
      Q.mcq('The Sundarbans are famous for', ['only ice peaks', 'mangrove forests and tigers', 'cactus desert only', 'coral without trees'], 1),
      Q.short('A place set aside to protect animals is a wildlife ____ or national park.', 'sanctuary', { accepted: ['sanctuary', 'wildlife sanctuary', 'reserve', 'national', 'park'] }),
      Q.mcq('Thorny bushes are typical of', ['the Western Ghats rainforest', 'desert / dry areas', 'the Himalayan snowline', 'coral reefs'], 1),
      Q.mcq('Cutting forests freely', ['has no effect on rain or animals', 'can affect rainfall, soil and wildlife', 'always increases tigers', 'creates only farmland with no loss'], 1, {
        scene: 'A hillside stripped of trees washes away in the first heavy rain; birds lose nesting sites.',
        explanation: 'Deforestation harms climate, soil and habitats.',
      }),
      Q.short('The season of retreating monsoon in India is mainly', 'autumn', { accepted: ['autumn', 'October-November', 'October–November', 'retreating monsoon'] }),
      Q.mcq('Tropical rain forests in India are found mainly in', ['the Thar Desert', 'the Western Ghats and islands, and parts of the north-east', 'only Ladakh’s ice', 'the dry Deccan always'], 1),
      Q.mcq('Project Tiger was started to', ['hunt more tigers', 'protect the tiger and its habitat', 'replace forests with cities', 'export all tigers'], 1, {
        scene: 'National parks keep core forest where tigers can breed with less disturbance.',
        explanation: 'Project Tiger aims at conservation of the species and habitat.',
      }),
      Q.short('Natural vegetation that grows without human planting is called', 'natural vegetation', { accepted: ['natural vegetation', 'virgin vegetation', 'natural forests'] }),
      Q.mcq('Migratory birds visit India in winter because', ['India has no water', 'they seek milder weather and food', 'they dislike all wetlands', 'the monsoon never ends'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 20, chapterTitle: 'Understanding Diversity (Civics)',
    slug: 'diversity', name: 'Unity in Diversity', icon: '🪔',
    description: 'How India’s diversity of language, food and faith is lived, and why unity matters.',
    questions: [
      Q.mcq('Diversity means', ['everyone is identical', 'people differ in language, food, faith and more', 'only one festival exists', 'maps have one colour'], 1, {
        scene: 'In one school corridor you hear Tamil, Hindi and Assamese; lunch boxes smell of very different home food.',
        explanation: 'Diversity is the mix of ways people live and identify.',
      }),
      Q.mcq('The Jallianwala Bagh story in the chapter is used to show', ['only geography of Punjab', 'people of different backgrounds coming together', 'a type of crop', 'how to draw a map'], 1),
      Q.short('“Unity in ____” is a phrase often used for India.', 'diversity', { accepted: ['diversity', 'Diversity'] }),
      Q.mcq('A stereotype is', ['a careful individual fact', 'a fixed, over-simple idea about a group', 'a kind of map', 'a tax'], 1),
      Q.mcq('Two regions can share a similar climate yet', ['must have the same language and food', 'still differ in language, dress and food', 'cannot both be in India', 'never celebrate festivals'], 1, {
        scene: 'Kerala and the North-East both get heavy rain, but songs, scripts and dishes are not the same.',
        explanation: 'History and culture, not climate alone, shape diversity.',
      }),
      Q.short('Difference in the way people live, speak and worship is called', 'diversity', { accepted: ['diversity', 'cultural diversity', 'Diversity'] }),
      Q.mcq('Inequality becomes a problem when diversity is used to', ['enjoy many festivals', 'treat some groups as lesser', 'learn new languages', 'share food kindly'], 1),
      Q.mcq('Ladakh and Kerala are compared in the book to show', ['they are identical in every custom', 'very different regions that are both part of India', 'that only one can be Indian', 'only desert life'], 1, {
        scene: 'One chapter moves from cold high mountains and wool trade to coastal spices and the sea.',
        explanation: 'The contrast teaches diversity within one country.',
      }),
      Q.short('People of many religions joined the struggle against colonial rule. This is an example of', 'unity', { accepted: ['unity', 'unity in diversity', 'coming together', 'solidarity'] }),
      Q.mcq('Respecting diversity in a classroom means', ['forcing one language only', 'making space for different names, foods and festivals', 'ignoring all differences by mocking them', 'banning regional stories'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 21, chapterTitle: 'Diversity and Discrimination (Civics)',
    slug: 'discrimination', name: 'Prejudice & Inequality', icon: '⚖️',
    description: 'Prejudice, stereotypes, caste and gender inequality, and the Constitution’s promise of equality.',
    questions: [
      Q.mcq('Prejudice means', ['judging fairly after listening', 'judging someone negatively without knowing them', 'helping a neighbour', 'drawing a map'], 1, {
        scene: 'A child is teased about an accent on the first day, before anyone has heard her ideas.',
        explanation: 'Prejudice is a preconceived negative judgement.',
      }),
      Q.mcq('The Constitution forbids discrimination on grounds such as', ['only favourite sports', 'religion, caste and gender (among others)', 'only hair colour in one city', 'map scale'], 1),
      Q.short('Treating someone unfairly because of their caste is', 'discrimination', { accepted: ['discrimination', 'untouchability', 'caste discrimination'] }),
      Q.mcq('Dr B.R. Ambedkar fought against', ['literacy', 'caste discrimination', 'trains', 'rivers'], 1),
      Q.mcq('Inequality of respect can exist', ['only when incomes differ', 'even when incomes look similar', 'never in India', 'only in geography class'], 1, {
        scene: 'Two students score the same marks, but one is still spoken to as if they “cannot belong” in the lead role.',
        explanation: 'Dignity gaps are not only about money.',
      }),
      Q.short('A fixed idea such as “girls cannot do science” is a', 'stereotype', { accepted: ['stereotype', 'gender stereotype', 'Stereotype'] }),
      Q.mcq('Untouchability is', ['allowed by the Constitution', 'abolished and forbidden', 'a type of monsoon', 'a landform'], 1),
      Q.mcq('Stereotypes are harmful because they', ['help us see each person clearly', 'stop us from seeing people as individuals', 'increase fairness', 'are always true measurements'], 1, {
        scene: 'A teacher assumes a quiet boy cannot lead, and never gives him a chance to try.',
        explanation: 'Stereotypes box people in.',
      }),
      Q.short('The first law minister of independent India, who faced caste discrimination, was', 'Ambedkar', { accepted: ['Ambedkar', 'B.R. Ambedkar', 'Dr Ambedkar', 'Dr B.R. Ambedkar'] }),
      Q.mcq('Equality in the Constitution means the government should', ['favour one caste always', 'not discriminate and should work to reduce inequality', 'ignore all unfair treatment', 'ban all diversity'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 22, chapterTitle: 'What is Government? (Civics)',
    slug: 'government', name: 'Why We Need Government', icon: '🏛️',
    description: 'Why we need government, three levels, laws, democracy vs monarchy, and adult franchise.',
    questions: [
      Q.mcq('Who is responsible for local streets and streetlights in a rural village?', ['the United Nations', 'the Gram Panchayat', 'the Supreme Court only', 'a private king'], 1, {
        scene: 'Potholes and dark lanes worry villagers. They take the complaint to the elected village body, not to a far-off court first.',
        explanation: 'Local civic work in a village is the Gram Panchayat’s job.',
      }),
      Q.mcq('Democracy means', ['one person rules by birth only', 'people have a say in how they are governed', 'no laws exist', 'only the army votes'], 1),
      Q.short('The three levels of government in India are local, state and', 'union', { accepted: ['union', 'central', 'national', 'Union / central'] }),
      Q.mcq('Universal Adult Franchise means', ['only rich men vote', 'every adult citizen can vote', 'children elect the PM', 'votes are sold'], 1),
      Q.mcq('Monarchy is rule by', ['elected representatives only', 'a king or queen, not by elected representatives', 'the Gram Sabha alone', 'all adults equally always'], 1, {
        scene: 'In a story-book kingdom the crown passes from parent to child; subjects do not elect the ruler.',
        explanation: 'Monarchy is hereditary rule.',
      }),
      Q.short('Rules that everyone is expected to follow, made by government, are', 'laws', { accepted: ['laws', 'law', 'the law'] }),
      Q.mcq('Government is needed to', ['only print textbooks', 'make and enforce decisions for the community (order, welfare, rights)', 'replace all families', 'stop all schools'], 1),
      Q.mcq('Women in India got the constitutional right to vote', ['never', 'along with men as adult citizens, not after a long separate wait as in some countries', 'only in 2010', 'only if they owned land'], 1, {
        scene: 'The chapter contrasts India’s adult franchise at independence with countries that delayed votes for women.',
        explanation: 'The Constitution gave adult women the vote from the start of the Republic.',
      }),
      Q.short('A government where people elect their leaders is a', 'democracy', { accepted: ['democracy', 'democratic government', 'Democracy'] }),
      Q.mcq('Traffic rules are an example of', ['optional suggestions with no government', 'laws that government can enforce', 'only school homework', 'monarchy only'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 23, chapterTitle: 'Key Elements of a Democratic Government (Civics)',
    slug: 'democracy', name: 'How Democracy Works', icon: '🗳️',
    description: 'Participation, accountability, conflict resolution, equality and franchise.',
    questions: [
      Q.short("What does 'Universal Adult Franchise' mean?", 'Every adult citizen has the right to vote', {
        accepted: [
          'Every adult citizen has the right to vote',
          'Every adult citizen can vote',
          'all adult citizens can vote',
          'the right of every adult citizen to vote',
        ],
        scene: 'On polling day, women and men of every caste and income stand in one line with voter ID cards.',
        rubric: 'Every adult citizen can vote, regardless of caste, gender or wealth.',
      }),
      Q.mcq('In a democracy, the government must', ['never explain itself', 'be accountable and answerable to the people', 'ban all newspapers', 'cancel all elections'], 1),
      Q.mcq('Resolving conflict without violence is important because', ['it is slower always', 'it protects rights and peace', 'courts are closed', 'maps change'], 1, {
        scene: 'Two groups dispute a river’s water. A fair hearing is better than a street fight.',
        explanation: 'Peaceful resolution protects rights.',
      }),
      Q.short('Elections are held so people can ____ their representatives.', 'choose', { accepted: ['choose', 'elect', 'select', 'vote for'] }),
      Q.mcq('Apartheid in South Africa was', ['a sports festival', 'a system of racial discrimination', 'a type of monsoon', 'universal franchise'], 1),
      Q.mcq('Participation in a democracy includes', ['only sleeping on polling day', 'voting, discussing, and speaking up about issues', 'never reading the news', 'leaving all decisions to one family forever'], 1),
      Q.short('When leaders must explain their actions to citizens, that is', 'accountability', { accepted: ['accountability', 'accountable', 'answerability'] }),
      Q.mcq('Equality in a democracy means the government should', ['favour one race as in apartheid', 'treat people fairly and not support discrimination', 'stop all votes', 'rule by birth only'], 1, {
        scene: 'The chapter uses South Africa’s struggle to show why racial domination is the opposite of democratic equality.',
        explanation: 'Democracy requires equal respect and rights.',
      }),
      Q.mcq('If a decision harms a minority, a democratic government should', ['ignore them always', 'listen and seek a just solution', 'ban their language as a first step', 'cancel courts'], 1),
      Q.short('Nelson Mandela is remembered for fighting', 'apartheid', { accepted: ['apartheid', 'racial discrimination', 'apartheid in South Africa'] }),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 24, chapterTitle: 'Panchayati Raj (Civics)',
    slug: 'panchayat', name: 'Village Government', icon: '🏘️',
    description: 'Gram Sabha, Gram Panchayat, reservations and the three tiers of rural local government.',
    questions: [
      Q.mcq('All adult voters of a village meet in the', ['Lok Sabha', 'Gram Sabha', 'Rajya Sabha', 'High Court'], 1, {
        scene: 'Under a neem tree, every adult of the village can question how last year’s road money was spent.',
        explanation: 'The Gram Sabha is the meeting of all adult voters.',
      }),
      Q.mcq('The sarpanch is', ['a police rank in a city', 'the elected head of the Gram Panchayat', 'the President of India', 'a type of tax'], 1),
      Q.short('One-third of seats in panchayats are reserved for', 'women', { accepted: ['women', 'Women'] }),
      Q.mcq('The Zila Parishad works at the', ['village only', 'district level', 'United Nations', 'school classroom'], 1),
      Q.mcq('The Gram Sabha can', ['never ask about money', 'question the panchayat about money spent', 'elect the Prime Minister directly', 'run the Supreme Court'], 1, {
        scene: 'Accounts of a well-repair scheme are read out; members demand to know why the wall cracked.',
        explanation: 'The Gram Sabha watches over the panchayat’s work.',
      }),
      Q.short('The three tiers of Panchayati Raj are village, block and', 'district', { accepted: ['district', 'zila', 'Zila Parishad', 'district level'] }),
      Q.mcq('The Panchayat Secretary', ['is always the sarpanch’s child', 'helps keep records and call meetings', 'is the High Court judge', 'prints currency'], 1),
      Q.mcq('The Janpad / Panchayat Samiti is the', ['national parliament', 'block-level panchayat body', 'only a city mayor', 'army unit'], 1, {
        scene: 'Several village panchayats send members to a meeting at the block headquarters.',
        explanation: 'The middle tier works at block level.',
      }),
      Q.short('Who elects the members of the Gram Panchayat?', 'Gram Sabha / voters', { accepted: ['Gram Sabha', 'voters', 'the people', 'adult voters', 'Gram Sabha / voters'] }),
      Q.mcq('A watershed and drinking-water problem in a village is first a matter for', ['NASA', 'the local panchayat institutions', 'only foreign embassies', 'the stock market'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 25, chapterTitle: 'Rural Administration (Civics)',
    slug: 'rural-admin', name: 'Police Station & Patwari', icon: '👮',
    description: 'Land records, the patwari and tehsildar, FIRs and equal access to the police.',
    questions: [
      Q.mcq('Land records in a village are kept by the', ['postman', 'patwari / lekhpal', 'pilot', 'chef'], 1, {
        scene: 'Two farmers argue whose field ends at the neem tree. An official arrives with maps and measurement records.',
        explanation: 'The patwari (or lekhpal) maintains village land records.',
      }),
      Q.mcq('A woman who wants to register a complaint at the police station', ['must send a man instead', 'has the same right as a man to register it', 'can only write to the UN', 'must own land first'], 1),
      Q.short('The officer above the patwari at the tehsil is often the', 'tehsildar', { accepted: ['tehsildar', 'Tehsildar', 'tahsildar'] }),
      Q.mcq('An FIR is', ['a festival', 'a First Information Report at the police station', 'a type of tax', 'a school exam'], 1),
      Q.mcq('Measuring land fairly matters when', ['there is a dispute between farmers', 'nobody farms', 'only poems are written', 'maps are banned'], 1, {
        scene: 'A new canal changes the value of a strip of land; neighbours need an official measurement.',
        explanation: 'Fair measurement protects people in land disputes.',
      }),
      Q.short('The area a police station is responsible for is its', 'jurisdiction', { accepted: ['jurisdiction', 'area', 'circle', 'jurisdiction area'] }),
      Q.mcq('Hindu Succession Amendment (2005) is discussed to show that', ['daughters cannot inherit', 'daughters can get a share in agricultural land like sons', 'only sons farm', 'patwaris own all land'], 1),
      Q.mcq('If the local station refuses to file an FIR, a person may', ['give up all rights forever', 'approach a higher officer or use other legal remedies', 'only leave the country', 'never tell anyone'], 1, {
        scene: 'Mohan’s family’s complaint is brushed aside; the chapter discusses what they can do next.',
        explanation: 'There are higher authorities and legal paths if a station refuses.',
      }),
      Q.short('Khasra / land records help to show', 'ownership / area of land', { accepted: ['ownership', 'who owns the land', 'area', 'ownership / area of land', 'land ownership'] }),
      Q.mcq('The District Collector / administration works with the police and revenue staff to', ['ignore all village problems', 'maintain law, land records and public order in the district', 'only run trains', 'print textbooks alone'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 26, chapterTitle: 'Urban Administration (Civics)',
    slug: 'urban', name: 'Municipal Work', icon: '🏙️',
    description: 'Municipal corporations, wards, mayors, taxes and urban services such as garbage collection.',
    questions: [
      Q.mcq('Garbage collection in a big city is usually the job of the', ['Gram Panchayat', 'Municipal Corporation', 'Army only', 'Post Office'], 1, {
        scene: 'At dawn, a municipal truck moves down a ward collecting bins. This is city government work, not a village panchayat.',
        explanation: 'Urban sanitation is a municipal function.',
      }),
      Q.mcq('Cities are divided into wards so that', ['nobody can vote', 'people elect ward councillors', 'only the mayor is hereditary', 'garbage is never collected'], 1),
      Q.short('The head of a municipal corporation is often called the', 'mayor', { accepted: ['mayor', 'Mayor', 'the mayor'] }),
      Q.mcq('Municipal taxes help pay for', ['only space travel', 'street lights, water and sanitation', 'the President’s salary only', 'farming in villages only'], 1),
      Q.mcq('If a public service in a ward fails, citizens can', ['never complain', 'complain to the councillor or municipal office', 'only leave India', 'elect the sarpanch of that city'], 1, {
        scene: 'A broken streetlight stays dark for weeks; residents write to their ward councillor.',
        explanation: 'Urban local bodies are meant to be answerable.',
      }),
      Q.short('A smaller urban body in a town (not a huge city) is often a municipal', 'council', { accepted: ['council', 'municipality', 'municipal council', 'board'] }),
      Q.mcq('The Municipal Commissioner is usually', ['an elected child', 'an appointed official who implements decisions', 'the village patwari', 'a type of tax'], 1),
      Q.mcq('Property tax is a common municipal tax on', ['only bicycles in villages', 'buildings and land in the city', 'only forests', 'the Moon'], 1, {
        scene: 'A house owner receives a municipal bill based on the property’s assessed value.',
        explanation: 'Property tax funds city services.',
      }),
      Q.short('City areas elect representatives called ward', 'councillors', { accepted: ['councillors', 'councilors', 'councillor', 'corporators'] }),
      Q.mcq('Contracting a private company to collect garbage still leaves the city body', ['with no duty at all', 'responsible for seeing that the work is done', 'unable to tax anyone', 'replaced by the Gram Sabha'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 27, chapterTitle: 'Rural Livelihoods (Civics)',
    slug: 'rural-work', name: 'Farm & Non-farm Work', icon: '🚜',
    description: 'Farmers, landless labour, debt, and non-farm village occupations.',
    questions: [
      Q.mcq('A landless labourer usually earns by', ['owning a factory', 'working on others’ fields for wages', 'printing money', 'teaching in a university only'], 1, {
        scene: 'At harvest, Thulasi works on a landlord’s field from morning and is paid a daily wage, not a share of the land.',
        explanation: 'Landless labourers sell their labour on others’ farms.',
      }),
      Q.mcq('In a village', ['every family owns enough land to live on farming alone', 'not every family owns enough land to live on farming alone', 'nobody ever works', 'all are large farmers'], 1),
      Q.short('People who borrow money and struggle to repay are in', 'debt', { accepted: ['debt', 'Debt', 'indebted'] }),
      Q.mcq('Fishing, weaving and shopkeeping in a village are', ['only urban jobs', 'rural non-farm livelihoods', 'illegal always', 'the same as IT jobs'], 1),
      Q.mcq('A large farmer and a small farmer', ['have the same risks and profits always', 'do not have the same risks and profits', 'never use seeds', 'both own factories'], 1, {
        scene: 'One household hires labour and sells a surplus; another must also work for wages when their tiny plot fails.',
        explanation: 'Scale of land changes vulnerability and profit.',
      }),
      Q.short('Farmers who work on others’ land for a share of the crop are often called', 'sharecroppers', { accepted: ['sharecroppers', 'share croppers', 'tenant farmers', 'tenants'] }),
      Q.mcq('Kalpattu-type coastal villages may combine', ['only desert herding', 'farming with fishing and other work', 'only call centres', 'no sea at all'], 1),
      Q.mcq('When rains fail, small farmers often', ['become instantly rich', 'face crop loss and more debt', 'stop needing food', 'buy the whole village'], 1, {
        scene: 'A dry monsoon leaves a small plot brown; the family already owes the trader for last year’s seeds.',
        explanation: 'Crop failure hits small farmers hardest.',
      }),
      Q.short('Besides farming, village work can include', 'weaving', { accepted: ['weaving', 'fishing', 'shopkeeping', 'pottery', 'labour', 'many non-farm jobs'] }),
      Q.mcq('Agricultural labourers are among the', ['always richest group', 'poorer groups in many villages', 'only city mayors', 'owners of all land'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'Social Science', chapterNum: 28, chapterTitle: 'Urban Livelihoods (Civics)',
    slug: 'urban-work', name: 'Work in the City', icon: '🛠️',
    description: 'Street vendors, workshops, offices, regular vs casual work and the informal sector.',
    questions: [
      Q.mcq('A street vendor is part of the', ['only government service', 'informal / self-employed city work', 'armed forces', 'Gram Sabha'], 1, {
        scene: 'Bachchu Manjhi prepares a thela of snacks near a busy crossing. He has no office ID, yet the city depends on such work.',
        explanation: 'Street vending is typically informal self-employment.',
      }),
      Q.mcq('Factory and office workers usually have', ['less regular wages than casual labourers always', 'more regular wages than many casual labourers', 'no working hours', 'only farm land'], 1),
      Q.short('A person who employs workers in a workshop is an', 'employer', { accepted: ['employer', 'Employer', 'an employer'] }),
      Q.mcq('Call-centre staff typically work', ['only on farms', 'in offices using phones and computers', 'as fishers at sea', 'as patwaris'], 1),
      Q.mcq('In a city', ['everyone has a permanent job and a big house', 'people have very different kinds of work and security', 'there is no informal work', 'all are mayors'], 1, {
        scene: 'The same street has a vendor, a tailor’s shop, and a glass office tower — three kinds of urban livelihood.',
        explanation: 'Urban work is highly unequal in pay and security.',
      }),
      Q.short('Workers without a regular contract or social security are often in the', 'informal sector', { accepted: ['informal sector', 'unorganised sector', 'informal', 'unorganised'] }),
      Q.mcq('A showroom salesperson with a monthly salary is usually', ['casual daily wage only', 'in more organised / regular employment', 'a sarpanch', 'landless rural only'], 1),
      Q.mcq('Vendors on the street often face', ['guaranteed air-conditioned offices', 'eviction, bribes or lack of a safe pitch', 'zila parishad elections only', 'Ashokan edicts'], 1, {
        scene: 'A vegetable seller is told to move because “the footpath is not for them,” even though customers need the stall.',
        explanation: 'Informal vendors have insecure spaces.',
      }),
      Q.short('People who work in another’s factory for a daily wage without job security are', 'casual labourers', { accepted: ['casual labourers', 'casual workers', 'daily wage workers', 'casual labour'] }),
      Q.mcq('Urban livelihoods include', ['only farming on the Yamuna always', 'vending, workshops, factories and offices', 'only Gram Panchayat jobs', 'only herding sheep'], 1),
    ],
  }),

  // ── English (Honeycomb units + skill strands) ────────────────
  activity({
    classNum: C, subject: 'English', chapterNum: 1, chapterTitle: "Who Did Patrick's Homework?",
    slug: 'patrick', name: "Patrick's Homework", icon: '📚',
    description: 'Story facts, character inference, and the real reason Patrick’s grades improved.',
    questions: [
      Q.mcq('Patrick’s grades improved mainly because he', ['slept more', 'finally did the work himself (with the elf’s push)', 'left school', 'copied a robot'], 1, {
        scene: 'Patrick hates homework until a tiny elf bargains for help. Still, the elf demands that Patrick look up words, read and think.',
        explanation: 'The joke ending is that Patrick did the learning himself.',
      }),
      Q.mcq('The elf did', ['every bit of homework with no help from Patrick', 'not do it all alone; Patrick had to help', 'Patrick’s sports only', 'nothing at all ever'], 1),
      Q.short('A word for a small magical creature in the story is', 'elf', { accepted: ['elf', 'an elf', 'the elf'] }),
      Q.mcq('The opposite of “lazy” is', ['idle', 'hardworking', 'sleepy', 'late'], 1),
      Q.mcq('The story suggests that', ['there is a lasting shortcut to learning', 'there is no real shortcut to learning', 'elves should take all exams', 'homework is never useful'], 1, {
        scene: 'When the elf leaves, Patrick keeps the habits of reading and finishing tasks.',
        explanation: 'The theme is that practice, not magic, builds skill.',
      }),
      Q.short('Write one adjective for Patrick at the start of the story.', 'lazy', { accepted: ['lazy', 'idle', 'careless', 'uninterested'] }),
      Q.mcq('A “secret” of Patrick’s success, if we read between the lines, is', ['the elf’s magic wand alone', 'his own effort once he engaged with the work', 'cheating from a neighbour', 'never opening a book'], 1),
      Q.mcq('Which sentence is in the past tense?', ['Patrick does his sums now.', 'Patrick did his homework last night.', 'Patrick will play tomorrow.', 'Patrick is playing.'], 1, {
        scene: 'A diary line about last night’s sums uses a past-tense verb.',
        explanation: '“Did” marks simple past.',
      }),
      Q.short('The little man agrees to help for how many days in the story bargain? (Write the number if you remember; else write “until the work is done.”)', '35', { accepted: ['35', 'thirty-five', '35 days', 'until the work is done', 'till the work is done'] }),
      Q.mcq('“I don’t have to do it — he will.” This attitude is', ['responsible', 'dependent / avoiding work', 'brave', 'scientific'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'English', chapterNum: 2, chapterTitle: 'How the Dog Found Himself a New Master!',
    slug: 'dog', name: 'A New Master', icon: '🐕',
    description: 'Folk-tale sequence: why the dog left stronger beasts and chose man.',
    questions: [
      Q.mcq('The dog left the wolf, bear and lion because each', ['was kind', 'feared someone stronger', 'could not run', 'hated meat'], 1, {
        scene: 'The dog seeks a master who will not tremble. The wolf fears the bear, the bear fears the lion, and the lion fears man.',
        explanation: 'Each “master” is afraid of a stronger being.',
      }),
      Q.mcq('The dog wanted a master who would', ['be afraid of every beast', 'not be afraid of any other beast', 'never feed him', 'live only in the sea'], 1),
      Q.short('A synonym for “fierce” is', 'ferocious', { accepted: ['ferocious', 'savage', 'wild', 'fierce', 'cruel'] }),
      Q.mcq('Man was stronger in the story because even the lion', ['laughed', 'feared him', 'became a dog', 'flew away'], 1),
      Q.mcq('The tale is a folk explanation of', ['why cats climb trees only', 'why dogs live with people', 'why lions farm', 'why wolves write books'], 1, {
        scene: 'Storytellers imagine a time when the dog still chose a pack leader — and finally stayed with humans.',
        explanation: 'It explains the dog’s bond with man.',
      }),
      Q.short('Whom did the dog serve first among the wild animals (after leaving independence)?', 'wolf', { accepted: ['wolf', 'the wolf', 'a wolf'] }),
      Q.mcq('The dog’s character trait that drives the plot is', ['a wish for safety under a strong master', 'a love of homework', 'fear of food', 'hatred of man from the start'], 0),
      Q.mcq('“Master” in this story means', ['a school subject', 'one who is served and who protects', 'a type of map', 'only a king’s title'], 1, {
        scene: 'The dog offers loyalty in exchange for protection and a place in the household.',
        explanation: 'Master = the being he obeys and who shelters him.',
      }),
      Q.short('Write the order of masters after the wolf: bear, then ____, then man.', 'lion', { accepted: ['lion', 'the lion', 'Lion'] }),
      Q.mcq('A suitable moral is that', ['the weakest always rules the forest', 'people sought (and the dog found) the strongest protector', 'lions should do homework', 'wolves never fear anyone'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'English', chapterNum: 3, chapterTitle: "Taro's Reward",
    slug: 'taro', name: "Taro's Reward", icon: '🍶',
    description: 'Filial piety, the magic waterfall, and what happens when villagers become greedy.',
    questions: [
      Q.mcq('Taro worked hard mainly to', ['buy toys', 'get warm sake for his father', 'leave home', 'build a dam'], 1, {
        scene: 'A poor woodcutter chops extra wood so he can buy a warming drink for his old father on a cold night.',
        explanation: 'Taro’s motive is care for his father.',
      }),
      Q.mcq('The emperor rewarded Taro for', ['being a thoughtful son', 'winning a race', 'hiding the waterfall', 'leaving Japan'], 0),
      Q.short('A drink made from rice in the story is', 'sake', { accepted: ['sake', 'saké', 'rice wine'] }),
      Q.mcq('When villagers rushed to the waterfall they found', ['gold coins', 'only cold water (for the greedy)', 'a dragon', 'nothing at all'], 1),
      Q.mcq('A theme of the story is', ['kindness to parents', 'cheating at a fair', 'space travel', 'street vending'], 0, {
        scene: 'The waterfall gives Taro delicious sake, but selfish villagers taste only icy water.',
        explanation: 'Reward follows sincere filial love, not greed.',
      }),
      Q.short('Taro’s job in the forest is that of a', 'woodcutter', { accepted: ['woodcutter', 'wood cutter', 'forester'] }),
      Q.mcq('The magic waterfall answers Taro’s', ['wish to become emperor', 'wish to comfort his father', 'wish to stop working', 'wish to fly'], 1),
      Q.mcq('“Filial” in “filial piety” relates to', ['rivers only', 'duty and love toward parents', 'only school marks', 'weather'], 1, {
        scene: 'The emperor hears that a young man thinks first of his father’s comfort.',
        explanation: 'Filial = of a son or daughter toward parents.',
      }),
      Q.short('What did the greedy neighbours get from the waterfall?', 'cold water', { accepted: ['cold water', 'water', 'only water', 'icy water'] }),
      Q.mcq('The story is set in', ['a Japanese village in the forested hills', 'a desert in Rajasthan only', 'Kalpana’s spacecraft', 'Miss Beam’s school'], 0),
    ],
  }),
  activity({
    classNum: C, subject: 'English', chapterNum: 4, chapterTitle: 'An Indian-American Woman in Space',
    slug: 'kalpana', name: 'Kalpana Chawla', icon: '🚀',
    description: 'Kalpana Chawla’s life, work as an astronaut, and her message to students.',
    questions: [
      Q.mcq('Kalpana Chawla was', ['only a poet', 'an astronaut born in India', 'a cricketer', 'a medieval queen'], 1, {
        scene: 'A girl from Karnal dreams of flying; years later she orbits Earth aboard a NASA space shuttle.',
        explanation: 'She was an Indian-born American astronaut.',
      }),
      Q.mcq('She encouraged students to', ['give up science', 'dream and work hard', 'avoid exams', 'never leave their town'], 1),
      Q.short('A vehicle that travels in space is a', 'spacecraft', { accepted: ['spacecraft', 'spaceship', 'shuttle', 'space shuttle'] }),
      Q.mcq('A synonym for “inspire” is', ['discourage', 'motivate', 'hide', 'delay'], 1),
      Q.mcq('Her story shows that girls', ['cannot study aeronautics', 'can become scientists and astronauts', 'must only write poems', 'are barred from NASA in the text’s message'], 1, {
        scene: 'Kalpana tells Indian students that paths exist if they prepare — including paths to space.',
        explanation: 'The lesson is that gender need not block scientific careers.',
      }),
      Q.short('Kalpana’s hometown in India, mentioned in the lesson, is', 'Karnal', { accepted: ['Karnal', 'Karnal, Haryana'] }),
      Q.mcq('In space, ordinary things like eating or sleeping', ['are exactly as on Earth', 'need special arrangements because of microgravity', 'are impossible so astronauts never eat', 'use village wells'], 1),
      Q.mcq('“Aeronautical engineering” is closest in meaning to the study of', ['cooking only', 'aircraft and flight', 'ancient inscriptions', 'monsoon winds only'], 1, {
        scene: 'At college Kalpana chooses a branch that deals with machines that fly.',
        explanation: 'Aeronautics = science of flight.',
      }),
      Q.short('Write one quality Kalpana’s life encourages: courage, hard work, or curiosity.', 'hard work', { accepted: ['hard work', 'courage', 'curiosity', 'determination', 'perseverance'] }),
      Q.mcq('The Columbia disaster, in the lesson’s close, reminds us that', ['space travel has risks as well as wonder', 'she never flew', 'homework is magic', 'dogs choose masters'], 0),
    ],
  }),
  activity({
    classNum: C, subject: 'English', chapterNum: 5, chapterTitle: 'A Different Kind of School',
    slug: 'school', name: 'Miss Beam’s School', icon: '🏫',
    description: 'Empathy lessons: a day as blind, lame or mute at Miss Beam’s school.',
    questions: [
      Q.mcq('Miss Beam’s school makes children spend a day with a disability so they', ['fail exams', 'learn empathy', 'sleep more', 'leave school'], 1, {
        scene: 'One child is blindfolded, another has an arm bound; classmates must guide and help them through the day.',
        explanation: 'The method teaches what it feels like to need help.',
      }),
      Q.mcq('Helping a classmate who cannot see is', ['against the school’s method', 'part of the school’s method', 'only for teachers', 'a punishment'], 1),
      Q.short('Understanding another person’s feelings is called', 'empathy', { accepted: ['empathy', 'Empathy', 'compassion'] }),
      Q.mcq('The opposite of “kind” is', ['gentle', 'cruel', 'soft', 'fair'], 1),
      Q.mcq('The story asks us to', ['ignore people who struggle', 'imagine life in someone else’s place', 'laugh at disabilities', 'ban all games'], 1, {
        scene: 'The visitor realises that the “game” is serious training in thoughtfulness.',
        explanation: 'Theme: walk in another’s shoes.',
      }),
      Q.short('Miss Beam wants children to become more', 'thoughtful', { accepted: ['thoughtful', 'kind', 'helpful', 'empathetic', 'caring'] }),
      Q.mcq('A day as “lame” in the school means the child', ['runs races only', 'has movement limited so others must assist', 'teaches maths', 'goes to space'], 1),
      Q.mcq('The visitor’s first impression of the school is that it looks', ['like a prison only', 'quite ordinary, then the method surprises him', 'like a space station', 'like a Gram Panchayat'], 1, {
        scene: 'Gardens and a pleasant house — until he sees bandaged eyes and helping arms.',
        explanation: 'The difference is in education of the heart, not the building.',
      }),
      Q.short('Write one word for “unable to speak” as used in the school’s roles.', 'dumb', { accepted: ['dumb', 'mute', 'speechless'] }),
      Q.mcq('The best summary is that education should include', ['only marks in grammar', 'kindness and understanding of others’ difficulties', 'only sports', 'only punishment'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'English', chapterNum: 6, chapterTitle: 'Who I Am',
    slug: 'who', name: 'Who I Am', icon: '🧒',
    description: 'Different children describe talents, fears and hobbies — reading character from voice.',
    questions: [
      Q.mcq('The chapter shows that children', ['are all identical', 'have different talents and feelings', 'never feel afraid', 'hate games'], 1, {
        scene: 'One child loves numbers, another talks to animals, a third wants to design buildings — each “I” sounds different.',
        explanation: 'The unit celebrates varied selves.',
      }),
      Q.mcq('It is all right to', ['copy every hobby of your friends only', 'like different hobbies from your friends', 'hide all feelings always', 'mock someone’s fear'], 1),
      Q.short('A person who designs buildings is an', 'architect', { accepted: ['architect', 'Architect', 'an architect'] }),
      Q.mcq('A synonym for “talent” is', ['weakness', 'gift / skill', 'punishment', 'silence'], 1),
      Q.mcq('Talking about what you enjoy', ['never helps anyone know you', 'helps others know you', 'is only for adults', 'is a stereotype'], 1, {
        scene: 'Nasir speaks of his grandmother and cotton fields; Radha of climbing trees — we “meet” them through words.',
        explanation: 'Self-description builds connection.',
      }),
      Q.short('Write one thing you might include in a “Who I Am” paragraph (e.g. a hobby).', 'reading', { accepted: ['reading', 'sports', 'music', 'drawing', 'dance', 'science', 'football', 'cricket', 'art'] }),
      Q.mcq('Rohit’s interest in collecting things shows', ['he has no personality', 'a personal hobby that is part of identity', 'he must become a mayor', 'he dislikes all objects'], 1),
      Q.mcq('Seriolin / Dolma’s ambition in the lesson points to', ['never leaving home', 'a public role (such as leadership) she imagines for herself', 'only copying Patrick', 'fearing all mountains'], 1, {
        scene: 'A young speaker from a mountain region pictures a future of service and leadership.',
        explanation: 'Ambition is part of “who I am”.',
      }),
      Q.short('The opposite of “confident” is', 'shy', { accepted: ['shy', 'nervous', 'insecure', 'timid', 'unsure'] }),
      Q.mcq('A good “Who I Am” paragraph uses', ['only insults', 'first person (I) and specific details', 'only maps', 'only true/false ticks'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'English', chapterNum: 7, chapterTitle: 'Fair Play',
    slug: 'fair', name: 'Fair Play', icon: '⚖️',
    description: 'Jumman, Algu, the panchayat and why a judge must put justice above friendship.',
    questions: [
      Q.mcq('Algu decides the case fairly even though Jumman is his friend. This shows', ['cheating', 'integrity', 'fear', 'laziness'], 1, {
        scene: 'Jumman’s old aunt asks for her rights. Algu, sitting as head panch, does not favour his friend.',
        explanation: 'Integrity is doing right even when it costs a friendship — for a while.',
      }),
      Q.mcq('Later Jumman judges Algu’s case', ['with revenge only', 'without revenge, fairly', 'by running away', 'by tearing the bond'], 1),
      Q.short('A village council that settles disputes is a', 'panchayat', { accepted: ['panchayat', 'panch', 'the panchayat'] }),
      Q.mcq('The opposite of “just” is', ['fair', 'unjust', 'kind', 'honest'], 1),
      Q.mcq('Friendship should not stop a judge from being', ['unfair on purpose', 'fair', 'silent forever', 'absent'], 1, {
        scene: 'When Algu’s bullock dies and a buyer refuses to pay, Jumman now sits as panch — and the village watches his face.',
        explanation: 'The second judgement restores the idea that the panch’s voice is God’s, not a friend’s.',
      }),
      Q.short('Jumman’s aunt first goes to the panchayat because she wants', 'her rights / money', { accepted: ['her rights', 'money', 'her property', 'a monthly allowance', 'her rights / money', 'justice'] }),
      Q.mcq('The head panch is supposed to speak', ['only for his friend', 'for justice, as if for God', 'only in English', 'against all old people'], 1),
      Q.mcq('After the first case, Jumman feels', ['grateful to Algu', 'angry with Algu', 'eager to gift land', 'ready to become an elf'], 1, {
        scene: 'The two friends stop talking. Months later a new dispute puts Jumman in Algu’s old seat.',
        explanation: 'Jumman’s bitterness tests whether he can still be fair.',
      }),
      Q.short('The moral is that a judge must be', 'impartial', { accepted: ['impartial', 'fair', 'just', 'honest', 'unbiased'] }),
      Q.mcq('“Panch Parmeshwar” in the story suggests the panch’s word is', ['a joke', 'sacred / to be truthful', 'only about crops', 'the same as a stereotype'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'English', chapterNum: 8, chapterTitle: 'A Game of Chance',
    slug: 'fairground', name: 'The Lucky Shop', icon: '🎡',
    description: 'Rasheed at the Eid fair and why “lucky shops” are tricks, not fortune.',
    questions: [
      Q.mcq('Rasheed lost money because the shop', ['gave free prizes always', 'was a trick, not real luck', 'sold books', 'was closed'], 1, {
        scene: 'At the Eid fair a man in a lucky shop makes a boy win easily — until Rasheed’s turn, when the “luck” vanishes.',
        explanation: 'The shop is arranged to cheat eager players.',
      }),
      Q.mcq('Uncle warned Rasheed', ['to waste all his money there', 'not to waste money on such games', 'to sell the shop', 'to become the shopman'], 1),
      Q.short('A place with rides and stalls is a', 'fair', { accepted: ['fair', 'fairground', 'the fair'] }),
      Q.mcq('A synonym for “disappointed” is', ['thrilled', 'upset / let down', 'proud', 'asleep'], 1),
      Q.mcq('If something looks too easy to win, it may be', ['always honest', 'a trick', 'a school exam', 'a map scale'], 1, {
        scene: 'Bhaiya and Uncle stay calm while Rasheed throws coin after coin, hoping the next disc will be the prize.',
        explanation: 'Easy early wins are bait.',
      }),
      Q.short('The festival when Rasheed goes to the fair is', 'Eid', { accepted: ['Eid', 'Id', 'Eid festival'] }),
      Q.mcq('The shopman wants Rasheed to feel', ['wise and careful', 'that luck is about to change if he plays more', 'ready to go home', 'interested in science labs'], 1),
      Q.mcq('Uncle’s attitude after the loss is', ['to scold without teaching', 'calm; he had expected a trick', 'to buy the shop', 'to call the elf'], 1, {
        scene: 'Uncle pays no extra money to “win it back.” He lets Rasheed learn.',
        explanation: 'The adult models not chasing a con.',
      }),
      Q.short('Write one word for a game that cheats players: a ____.', 'trick', { accepted: ['trick', 'fraud', 'con', 'cheat', 'swindle'] }),
      Q.mcq('A good lesson from the chapter is', ['always trust a shouting shopman', 'do not throw good money after a dishonest game', 'fairs are illegal', ' Rasheed should never enjoy Eid'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'English', chapterNum: 9, chapterTitle: 'Desert Animals',
    slug: 'desert', name: 'Desert Survivors', icon: '🐪',
    description: 'How camels, gerbils, rattlesnakes and other desert animals get water and stay cool.',
    questions: [
      Q.mcq('A camel can travel far without water because it', ['never gets hot', 'is adapted to desert life', 'eats only ice', 'lives in the sea'], 1, {
        scene: 'A caravan crosses dunes. The camel’s body stores fat in the hump and loses water slowly.',
        explanation: 'Desert adaptations let camels go long without drinking.',
      }),
      Q.mcq('Many desert animals are active at night to', ['see the stars only', 'avoid the day’s heat', 'meet polar bears', 'find ice'], 1),
      Q.short('A gerbil is a small ____ that lives in burrows.', 'rodent', { accepted: ['rodent', 'animal', 'mammal', 'mouse-like rodent'] }),
      Q.mcq('Rattlesnakes warn others with', ['a song', 'their rattle', 'bright feathers', 'a roar'], 1),
      Q.mcq('Deserts', ['have no living animals at all', 'have animals specially adapted to heat and little water', 'are the same as rainforests', 'never have night'], 1, {
        scene: 'After sunset, gerbils pop from burrows and a mongoose hunts; the sand still holds the day’s warmth.',
        explanation: 'Deserts are living habitats, not empty land.',
      }),
      Q.short('The camel’s hump stores', 'fat', { accepted: ['fat', 'fatty tissue', 'food as fat'] }),
      Q.mcq('Fennec foxes have large ears that help them', ['swim faster', 'lose heat and hear prey', 'fly', 'store water like tanks'], 1),
      Q.mcq('Darkling beetles in some deserts can', ['photosynthesise like trees', 'collect moisture in clever ways', 'live only in the Arctic', 'bark like dogs'], 1, {
        scene: 'A beetle’s body catches fog or dew — a reading detail about desert survival.',
        explanation: 'Some beetles harvest water from air.',
      }),
      Q.short('Animals that sleep by day and wake at night are', 'nocturnal', { accepted: ['nocturnal', 'night animals', 'nocturnal animals'] }),
      Q.mcq('The chapter is mainly', ['a fairy tale about an elf', 'informational writing about real desert wildlife', 'a panchayat case', 'a notice format'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'English', chapterNum: 10, chapterTitle: 'The Banyan Tree',
    slug: 'banyan', name: 'The Banyan Tree', icon: '🌳',
    description: 'The boy in the banyan, the mongoose–cobra fight, and close observation of nature.',
    questions: [
      Q.mcq('The fight under the tree is between a', ['cat and mouse', 'mongoose and cobra', 'dog and deer', 'hawk and fish'], 1, {
        scene: 'From a platform in the old banyan the narrator watches a grey mongoose face a cobra in the garden below.',
        explanation: 'The climax is the mongoose–cobra battle.',
      }),
      Q.mcq('The narrator watches from the banyan like', ['a shopkeeper', 'a small naturalist', 'an astronaut', 'a sarpanch'], 1),
      Q.short('A mongoose is known as an enemy of the', 'snake', { accepted: ['snake', 'cobra', 'snakes'] }),
      Q.mcq('A banyan is special because it has', ['no leaves', 'many hanging roots', 'only thorns', 'blue flowers always'], 1),
      Q.mcq('The chapter mixes', ['only grammar drills', 'adventure with close observation of nature', 'only a lost-and-found notice', 'Ashoka’s edicts'], 1, {
        scene: 'Squirrels, birds and the changing light in the leaves matter as much as the fight.',
        explanation: 'It is a nature narrative, not only action.',
      }),
      Q.short('The boy builds a ____ in the tree to sit and read.', 'platform', { accepted: ['platform', 'a platform', 'perch', 'tree house', 'wooden platform'] }),
      Q.mcq('During the fight, other creatures', ['all sleep', 'gather to watch, as the boy describes', 'write notices', 'go to school'], 1),
      Q.mcq('The cobra is dangerous because of its', ['feathers', 'venom / fangs', 'humps', 'rattle only like a desert toy'], 1, {
        scene: 'The snake’s hood is raised; one bite could end the mongoose — yet the mongoose is quick.',
        explanation: 'Cobras are venomous; speed and skill decide the fight.',
      }),
      Q.short('The setting of the fight is a', 'garden', { accepted: ['garden', 'the garden', 'under the banyan', 'grandfather’s garden'] }),
      Q.mcq('A suitable title reason is that the banyan is', ['only a backdrop with no role', 'the boy’s world — lookout, library and theatre of nature', 'a desert animal', 'Miss Beam’s school'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'English', chapterNum: 11, chapterTitle: 'Grammar in Context',
    slug: 'grammar', name: 'Articles, Tenses, Prepositions', icon: '✍️',
    description: 'a/an/the, prepositions of time and place, and tense correction inside a short paragraph.',
    questions: [
      Q.short('Choose the article: She is ____ honest girl.', 'an', {
        accepted: ['an'],
        scene: 'In her diary Meera writes: “She is ___ honest girl who returned my lost purse.” The next sound is the vowel in “honest.”',
        rubric: 'Use an before a vowel sound; “honest” begins with a silent h.',
      }),
      Q.short('We will meet ____ Monday.', 'on', { accepted: ['on'] }),
      Q.mcq("Correct: He 'go' to school yesterday.", ['He go to school yesterday.', 'He went to school yesterday.', 'He gone to school yesterday.', 'He going to school yesterday.'], 1, {
        scene: 'A notice on the board is full of errors: “He go to school yesterday and see an owl.”',
        explanation: 'Yesterday needs the simple past: went.',
      }),
      Q.mcq('We use “an” before', ['a consonant sound, as in “a university” only always', 'a vowel sound, as in “an hour”', 'every noun', 'only names of cities'], 1),
      Q.short('The cat is ____ the table (sleeping on top).', 'on', { accepted: ['on'] }),
      Q.mcq('“The” is used when', ['we first mention any one of many', 'the listener knows which one we mean', 'we never mean a particular one', 'the noun is plural only'], 1, {
        scene: '“A boy found a dog. The boy wrapped the dog in a jacket.” The second mention uses the.',
        explanation: 'The marks something already identified.',
      }),
      Q.mcq('Fill the gap: They have lived here ____ 2018.', ['in', 'since', 'on', 'at'], 1),
      Q.mcq('Which sentence is correct?', ['She didn’t went to the fair.', 'She didn’t go to the fair.', 'She doesn’t went to the fair.', 'She not go to the fair yesterday.'], 1, {
        scene: 'Rasheed’s uncle edits a line in the boy’s diary about not returning to the lucky shop.',
        explanation: 'After did/didn’t use the base verb: go.',
      }),
      Q.short('Article: I saw ____ European tourist at the museum (consonant sound “y”).', 'a', { accepted: ['a'] }),
      Q.mcq('Preposition of place: The books are ____ the shelf (inside / resting there).', ['between Monday', 'on', 'since', 'ago'], 1),
    ],
  }),
  activity({
    classNum: C, subject: 'English', chapterNum: 12, chapterTitle: 'Reading Comprehension',
    slug: 'comprehension', name: 'Unseen Passage', icon: '📖',
    description: 'Factual and inferential questions on a short unseen passage about kindness in the rain.',
    questions: [
      Q.mcq('Why was the dog shivering?', ['It was laughing', 'It was cold and wet / frightened', 'It was dancing', 'It had eaten ice cream'], 1, {
        scene: 'Rain needles the street. A thin stray dog presses itself under a tea stall, fur stuck to its ribs. A boy kneels, pulls off his jacket, and wraps the animal. The stall owner brings a steel plate of leftover rice. The dog’s shaking slows. “You’re safe now,” the boy whispers, though nobody taught him those words.',
        explanation: 'Shivering here means cold, wet and fear — not play.',
      }),
      Q.mcq('The boy’s action shows he is', ['cruel', 'compassionate', 'lazy', 'angry'], 1),
      Q.mcq('Inference means', ['copying a sentence word for word only', 'working out a meaning that is not spelled out word for word', 'ignoring the passage', 'counting commas'], 1, {
        scene: 'The passage never says “the boy is kind,” yet we know it from the jacket and the whisper.',
        explanation: 'Inference reads between the lines.',
      }),
      Q.short('A word for a dog without a home is a ____ dog.', 'stray', { accepted: ['stray', 'homeless', 'street'] }),
      Q.short('Write one sentence the boy might say to the dog.', 'You are safe with me now.', {
        accepted: ['You are safe with me now.', 'You are safe.', 'Come, you are safe.', 'I will help you.', 'You are my friend now.'],
        rubric: 'Any kind line that fits the rescue (safe / home / help / friend).',
      }),
      Q.mcq('The stall owner’s rice plate suggests', ['he wants the dog gone only', 'the community can share kindness', 'the boy failed', 'it is a desert chapter'], 1),
      Q.mcq('“The dog’s shaking slows” implies the dog begins to', ['feel safer and warmer', 'run a race', 'read a notice', 'join a panchayat'], 0, {
        scene: 'After the jacket and food, the violent shiver eases — a clue, not a dictionary definition.',
        explanation: 'The body language shows comfort returning.',
      }),
      Q.short('Find a word in the passage idea that means “thin and bony.” (from “ribs” picture)', 'thin', { accepted: ['thin', 'skinny', 'bony', 'underfed'] }),
      Q.mcq('The whisper “You’re safe now” is important because', ['it is a grammar error', 'it shows care, not just a physical act', 'dogs read English notices', 'it is a municipal tax'], 1),
      Q.short('What is the main idea of the passage in a few words?', 'kindness to a stray', { accepted: ['kindness to a stray', 'compassion', 'helping a stray dog', 'kindness in the rain', 'rescue of a dog'] }),
    ],
  }),
  activity({
    classNum: C, subject: 'English', chapterNum: 13, chapterTitle: 'Functional Writing',
    slug: 'writing', name: 'Notice & Diary', icon: '📝',
    description: 'Notice format (date, heading, body, sign-off) and first-person diary voice.',
    questions: [
      Q.mcq('A school notice about a lost-and-found event must include', ['only emojis', 'date, heading, what/when/where, and who to contact', 'a poem of 20 stanzas', 'the national anthem only'], 1, {
        scene: 'The Cultural Club will hold a Lost-and-Found hour next Friday, 1:00 p.m., in the activity hall. Students should bring labelled items and see Ms Rao.',
        explanation: 'Notices need date, heading, facts and a name/designation.',
      }),
      Q.mcq('A diary is usually written in', ['only the third person like a news report', 'the first person and can include feelings', 'only Roman numerals', 'passive voice with no “I” ever'], 1),
      Q.short('The heading of a notice is often written in ____ letters.', 'capital', { accepted: ['capital', 'block', 'capital letters', 'block letters'] }),
      Q.mcq('Who usually signs a school notice?', ['a random student with no role', 'the teacher / secretary / organiser named', 'a cartoon character', 'nobody ever'], 1),
      Q.mcq('A notice should', ['hide the date so that more people come', 'show the date clearly', 'avoid the place', 'be only a secret diary'], 1, {
        scene: 'Without a date, students arrive on the wrong Friday and the hall is locked.',
        explanation: 'Date and time are essential notice facts.',
      }),
      Q.short('A diary entry often begins with the ____ and sometimes “Dear Diary.”', 'date', { accepted: ['date', 'the date', 'date and day'] }),
      Q.mcq('Which is the best notice heading?', ['wow stuff', 'LOST-AND-FOUND CAMP', 'i think maybe', 'Chapter 13 only'], 1),
      Q.mcq('Tone of a school notice should be', ['rude and jokey only', 'clear, formal and brief', 'as long as a novel', 'written only in code'], 1, {
        scene: 'Compare: “Yo find ur bag maybe” versus “Students may collect lost items from the activity hall on Friday, 1 p.m.”',
        explanation: 'Functional writing is concise and formal.',
      }),
      Q.short('Name one feeling word you might use in a diary (e.g. excited, nervous).', 'excited', { accepted: ['excited', 'nervous', 'happy', 'sad', 'proud', 'worried', 'relieved'] }),
      Q.mcq('The sign-off of a notice typically has', ['only a smiley', 'name and designation of the issuer', 'a full autobiography', 'no name so it looks official'], 1),
    ],
  }),
];
