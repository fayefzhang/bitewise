import StepSelection from "../components/stepselection";
import { interests } from "../common/utils";

const InterestsPage = () => {
  return (
    <StepSelection
      title="Select Topics to Follow"
      options={interests}
      nextPage="/sources"
      stepNo={2}
    />
  );
};

export default InterestsPage;
