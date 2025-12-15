// seed-firestore.js
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the service account JSON
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Get Firestore instance
const db = admin.firestore();

// Trivia questions array
const questions = [
  { Question: "What is traditionally placed on top of a Christmas tree?", Option1: "Star", Option2: "Candy Cane", Option3: "Bell", Option4: "Snowflake", Answer: "Star", Category: "Christmas" },
  { Question: "Which country started the tradition of putting up a Christmas tree?", Option1: "Germany", Option2: "USA", Option3: "France", Option4: "Canada", Answer: "Germany", Category: "Christmas" },
  { Question: "In the song 'The Twelve Days of Christmas', what did my true love give me on the 5th day?", Option1: "Five golden rings", Option2: "Five candy canes", Option3: "Five elves", Option4: "Five gingerbreads", Answer: "Five golden rings", Category: "Christmas" },
  { Question: "Who tries to stop Christmas from coming, by stealing all the presents?", Option1: "The Grinch", Option2: "Scrooge", Option3: "Jack Frost", Option4: "Rudolph", Answer: "The Grinch", Category: "Christmas" },
  { Question: "What beverage is also known as 'milk punch' and is popular around Christmas?", Option1: "Eggnog", Option2: "Hot chocolate", Option3: "Mulled wine", Option4: "Apple cider", Answer: "Eggnog", Category: "Christmas" },
  { Question: "What is the name of the red-nosed reindeer?", Option1: "Rudolph", Option2: "Dasher", Option3: "Blitzen", Option4: "Comet", Answer: "Rudolph", Category: "Christmas" },
  { Question: "What color suit did Santa wear before Coca-Cola made him red?", Option1: "Green", Option2: "Blue", Option3: "Purple", Option4: "White", Answer: "Green", Category: "Christmas" },
  { Question: "In 'Home Alone', where are the McCallisters going on vacation when they leave Kevin behind?", Option1: "Paris", Option2: "London", Option3: "Rome", Option4: "New York", Answer: "Paris", Category: "Christmas" },
  { Question: "Which plant is associated with Christmas and known for its red and green leaves?", Option1: "Poinsettia", Option2: "Mistletoe", Option3: "Holly", Option4: "Fern", Answer: "Poinsettia", Category: "Christmas" },
  { Question: "What date is the Christmas holiday?", Option1: "December 25", Option2: "December 24", Option3: "January 1", Option4: "November 25", Answer: "December 25", Category: "Christmas" },
  { Question: "What color suit is Santa Claus most commonly depicted wearing?", Option1: "Green", Option2: "Blue", Option3: "Red", Option4: "White", Answer: "Red", Category: "Christmas" },
  { Question: "How many days are there in the Twelve Days of Christmas?", Option1: "10", Option2: "11", Option3: "12", Option4: "13", Answer: "12", Category: "Christmas" },
  { Question: "What beverage is often left out for Santa on Christmas Eve?", Option1: "Milk", Option2: "Juice", Option3: "Tea", Option4: "Soda", Answer: "Milk", Category: "Christmas" },
  { Question: "What Christmas song contains the lyric “Let us adore Him”?", Option1: "Joy to the World", Option2: "O Come All Ye Faithful", Option3: "Silent Night", Option4: "Hark the Herald Angels Sing", Answer: "O Come All Ye Faithful", Category: "Christmas" },
  { Question: "What do people traditionally hang over doorways to kiss under?", Option1: "Holly", Option2: "Mistletoe", Option3: "Pine", Option4: "Garland", Answer: "Mistletoe", Category: "Christmas" },
  { Question: "What is Frosty the Snowman’s nose made of?", Option1: "Coal", Option2: "Button", Option3: "Carrot", Option4: "Pebble", Answer: "Carrot", Category: "Christmas" },
  { Question: "Which reindeer’s name means “thunder”?", Option1: "Donner", Option2: "Dasher", Option3: "Cupid", Option4: "Vixen", Answer: "Donner", Category: "Christmas" },
  { Question: "What popular Christmas song was written by Irving Berlin?", Option1: "Jingle Bells", Option2: "White Christmas", Option3: "The First Noel", Option4: "O Holy Night", Answer: "White Christmas", Category: "Christmas" },
  { Question: "What is traditionally hidden inside a Christmas pudding?", Option1: "Coin", Option2: "Ring", Option3: "Button", Option4: "Bean", Answer: "Coin", Category: "Christmas" },
  { Question: "Which holiday character is known as “Old St. Nick”?", Option1: "Santa Claus", Option2: "Father Time", Option3: "The Elf King", Option4: "Kris Kringle", Answer: "Santa Claus", Category: "Christmas" },
  { Question: "What decoration is traditionally made of evergreen branches?", Option1: "Wreath", Option2: "Stocking", Option3: "Ornament", Option4: "Tinsel", Answer: "Wreath", Category: "Christmas" },
  { Question: "Which Christmas song begins with “You better watch out”?", Option1: "Jingle Bells", Option2: "Santa Claus Is Coming to Town", Option3: "Frosty the Snowman", Option4: "Deck the Halls", Answer: "Santa Claus Is Coming to Town", Category: "Christmas" },
  { Question: "What was the first toy advertised on television?", Option1: "Mr. Potato Head", Option2: "Barbie", Option3: "Hot Wheels", Option4: "Teddy Bear", Answer: "Mr. Potato Head", Category: "Christmas" },
  { Question: "Which country celebrates Christmas on January 7th?", Option1: "Mexico", Option2: "Russia", Option3: "Spain", Option4: "Canada", Answer: "Russia", Category: "Christmas" },
  { Question: "What animal pulls Santa’s sleigh?", Option1: "Horses", Option2: "Elves", Option3: "Dogs", Option4: "Reindeer", Answer: "Reindeer", Category: "Christmas" },
  { Question: "Which Christmas treat is shaped like a hook?", Option1: "Gingerbread", Option2: "Candy Cane", Option3: "Fudge", Option4: "Cookie", Answer: "Candy Cane", Category: "Christmas" },
  { Question: "What do elves traditionally make in Santa’s workshop?", Option1: "Candles", Option2: "Toys", Option3: "Clothes", Option4: "Food", Answer: "Toys", Category: "Christmas" },
  { Question: "Which Christmas song mentions “a partridge in a pear tree”?", Option1: "Joy to the World", Option2: "Twelve Days of Christmas", Option3: "Silent Night", Option4: "Deck the Halls", Answer: "Twelve Days of Christmas", Category: "Christmas" },
  { Question: "What color are traditional Christmas stockings?", Option1: "Green", Option2: "Red", Option3: "Blue", Option4: "Gold", Answer: "Red", Category: "Christmas" },
  { Question: "What is the name of the Grinch’s dog?", Option1: "Max", Option2: "Buddy", Option3: "Rex", Option4: "Snowy", Answer: "Max", Category: "Christmas" },
  { Question: "Which holiday is celebrated the day after Christmas?", Option1: "New Year’s Eve", Option2: "Boxing Day", Option3: "Three Kings Day", Option4: "Epiphany", Answer: "Boxing Day", Category: "Christmas" },
  { Question: "What do people traditionally put inside stockings?", Option1: "Fruit", Option2: "Candy", Option3: "Gifts", Option4: "All of the above", Answer: "All of the above", Category: "Christmas" },
  { Question: "Which Christmas song was originally written for Thanksgiving?", Option1: "Jingle Bells", Option2: "O Holy Night", Option3: "Silent Night", Option4: "Hark the Herald Angels Sing", Answer: "Jingle Bells", Category: "Christmas" },
  { Question: "What type of tree is most commonly used as a Christmas tree?", Option1: "Oak", Option2: "Maple", Option3: "Pine", Option4: "Fir", Answer: "Fir", Category: "Christmas" },
  { Question: "Which spice is commonly used in Christmas baking?", Option1: "Cinnamon", Option2: "Pepper", Option3: "Cumin", Option4: "Paprika", Answer: "Cinnamon", Category: "Christmas" },
  { Question: "What shape are most Christmas ornaments?", Option1: "Square", Option2: "Triangle", Option3: "Round", Option4: "Star", Answer: "Round", Category: "Christmas" },
  { Question: "What is the traditional Christmas flower in Mexico?", Option1: "Poinsettia", Option2: "Rose", Option3: "Lily", Option4: "Tulip", Answer: "Poinsettia", Category: "Christmas" },
  { Question: "Which famous ballet is associated with Christmas?", Option1: "Swan Lake", Option2: "The Nutcracker", Option3: "Romeo and Juliet", Option4: "Cinderella", Answer: "The Nutcracker", Category: "Christmas" },
  { Question: "What do the bells on Santa’s sleigh do?", Option1: "Decorate", Option2: "Jingle", Option3: "Ring loudly", Option4: "Glow", Answer: "Jingle", Category: "Christmas" },
  { Question: "Which Christmas character says “Bah, Humbug”?", Option1: "The Grinch", Option2: "Santa Claus", Option3: "Ebenezer Scrooge", Option4: "Father Christmas", Answer: "Ebenezer Scrooge", Category: "Christmas" },
  { Question: "What color is mistletoe traditionally associated with?", Option1: "Red", Option2: "Green", Option3: "White", Option4: "Gold", Answer: "Green", Category: "Christmas" },
  { Question: "Which holiday dessert is shaped like a log?", Option1: "Fruitcake", Option2: "Yule Log", Option3: "Pie", Option4: "Pudding", Answer: "Yule Log", Category: "Christmas" },
  { Question: "How many reindeer pull Santa’s sleigh including Rudolph?", Option1: "8", Option2: "9", Option3: "10", Option4: "11", Answer: "9", Category: "Christmas" },
  { Question: "What do people sing during Christmas celebrations?", Option1: "Carols", Option2: "Hymns", Option3: "Chants", Option4: "All of the above", Answer: "All of the above", Category: "Christmas" },
  { Question: "Which Christmas movie features Kevin McCallister?", Option1: "Elf", Option2: "Home Alone", Option3: "The Santa Clause", Option4: "A Christmas Story", Answer: "Home Alone", Category: "Christmas" },
  { Question: "What traditional Christmas scent comes from dried orange peels and spices?", Option1: "Potpourri", Option2: "Cider", Option3: "Incense", Option4: "Perfume", Answer: "Potpourri", Category: "Christmas" },
  { Question: "What is traditionally wrapped around Christmas presents?", Option1: "Ribbon", Option2: "Chain", Option3: "String", Option4: "Wire", Answer: "Ribbon", Category: "Christmas" },
  { Question: "Which Christmas song begins with “Silent night, holy night”?", Option1: "Silent Night", Option2: "O Holy Night", Option3: "Joy to the World", Option4: "Away in a Manger", Answer: "Silent Night", Category: "Christmas" },
  { Question: "What do people traditionally place gifts under?", Option1: "Table", Option2: "Chair", Option3: "Tree", Option4: "Fireplace", Answer: "Tree", Category: "Christmas" },
  { Question: "Which holiday figure wears a red hat with white trim?", Option1: "Snowman", Option2: "Elf", Option3: "Santa Claus", Option4: "Gnome", Answer: "Santa Claus", Category: "Christmas" },
  { Question: "What Christmas decoration is made of thin strips of shiny material?", Option1: "Tinsel", Option2: "Garland", Option3: "Ribbon", Option4: "Foil", Answer: "Tinsel", Category: "Christmas" },
  { Question: "Which Christmas song includes the lyric “Fa la la”?", Option1: "Deck the Halls", Option2: "Jingle Bells", Option3: "Frosty the Snowman", Option4: "Silent Night", Answer: "Deck the Halls", Category: "Christmas" },
  { Question: "What do children often write to Santa?", Option1: "A Song", Option2: "A Card", Option3: "A Letter", Option4: "A Poem", Answer: "A Letter", Category: "Christmas" },
  { Question: "Which holiday food is known for being very dense?", Option1: "Pie", Option2: "Fruitcake", Option3: "Cookies", Option4: "Fudge", Answer: "Fruitcake", Category: "Christmas" },
  { Question: "What is Santa’s workshop location?", Option1: "North Pole", Option2: "South Pole", Option3: "Iceland", Option4: "Greenland", Answer: "North Pole", Category: "Christmas" },
  { Question: "Which Christmas symbol represents peace?", Option1: "Bell", Option2: "Dove", Option3: "Star", Option4: "Candle", Answer: "Dove", Category: "Christmas" },
  { Question: "What time of year is Christmas celebrated?", Option1: "Spring", Option2: "Summer", Option3: "Fall", Option4: "Winter", Answer: "Winter", Category: "Christmas" },
  { Question: "Which decoration is usually hung on the front door?", Option1: "Stocking", Option2: "Wreath", Option3: "Ornament", Option4: "Bell", Answer: "Wreath", Category: "Christmas" },
  { Question: "What Christmas character is made of snow?", Option1: "Elf", Option2: "Snowman", Option3: "Reindeer", Option4: "Gnome", Answer: "Snowman", Category: "Christmas" },
  { Question: "Which Christmas song includes the lyric “Walking in a winter wonderland”?", Option1: "Jingle Bells", Option2: "Winter Wonderland", Option3: "Frosty the Snowman", Option4: "Let It Snow", Answer: "Winter Wonderland", Category: "Christmas" },
  { Question: "What traditional Christmas meal often includes turkey or ham?", Option1: "Breakfast", Option2: "Lunch", Option3: "Dinner", Option4: "Snack", Answer: "Dinner", Category: "Christmas" }
];

async function seedQuestions() {
  const batch = db.batch();
  questions.forEach((q, index) => {
    const docRef = db.collection('questions').doc(); // Auto-generated ID
    batch.set(docRef, q);
  });

  await batch.commit();
  console.log(`✅ Seeded ${questions.length} questions to Firestore!`);
}

seedQuestions().catch(err => console.error('❌ Error seeding questions:', err));
