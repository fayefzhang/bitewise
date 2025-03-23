import StepSelection from "../components/stepselection";
import { sources } from "../common/utils";

const SourcesPage = () => {
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
