import StepSelection from "../components/stepselection";

const SourcesPage = () => {
  const sources = [
    "CNN",
    "BBC",
    "Reuters",
    "The New York Times",
    "The Guardian",
    "Al Jazeera",
    "Fox News",
    // ... add more sources here
  ];

  return (
    <StepSelection
      title="Step 3 of 3: Choose sources"
      options={sources}
      nextPage="/profile"
      stepNo={3}
    />
  );
};

export default SourcesPage;
