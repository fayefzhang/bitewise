export const sampleRelatedSource = {
  id: 1,
  title: "Chancellor Scholz...",
  source: "Reuters",
  time: "1 hr ago",
  bias: "right-center",
};

export const sampleArticle = {
  id: 1,
  url: "https://www.cnbc.com/2022/12/07/germanys-ruling-coalition-collapses-as-chancellor-scholz-fires-finance-minister.html",
  imageUrl: "/article-thumbnail.jpg",
  title:
    "Germany’s ruling coalition collapses as Chancellor Scholz fires finance minister",
  source: "CNBC",
  content: "Germany’s ruling coalition collapsed on Wednesday...",
  time: "1 hr ago",
  cluster: 1,
  date: "5 hours ago",
  bias: "center",
  readTime: "5 MIN READ",
  relatedSources: [sampleRelatedSource],
  details: [
    "Scholz sacks finance minister Lindner over budget disputes",
    "Scholz expected to lead minority government with Social Democrats and Greens",
    "To hold confidence vote in January triggering snap elections",
    "Political shake-up could benefit populist movements such as AfD",
    "Scholz to ask opposition conservatives for support",
  ],
  fullContent: "",
};

export const sampleSummary = {
  title: "Germany",
  summary:
    "Germany's ruling coalition collapses as Chancellor Scholz fires finance minister. Also, France and Germany hold talks over Trump election win and Germany's cabinet approves draft law on voluntary military service.",
};
