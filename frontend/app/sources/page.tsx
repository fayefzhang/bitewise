import StepSelection from "../components/stepselection";
import { sources } from "../common/utils";

const SourcesPage = () => {
  return (
    <StepSelection
      title="Select Sources to Follow or Exclude"
      options={sources}
      nextPage="/profile"
      stepNo={3}
    />
  );
};

export default SourcesPage;
