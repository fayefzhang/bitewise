import StepSelection from "../components/stepselection";
import { interests } from "../common/utils";

const InterestsPage = () => {
  return (
    <StepSelection
      title="Step 2 of 3: Choose interests"
      options={interests}
      nextPage="/sources"
      stepNo={2}
    />
  );
};

export default InterestsPage;
