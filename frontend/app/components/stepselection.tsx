import React from "react";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";

interface StepSelectionProps {
  title: string;
  options: string[];
  nextPage: string;
  stepNo: number;
}

const StepSelection: React.FC<StepSelectionProps> = ({
  title,
  options,
  nextPage,
  stepNo,
}) => {
  if (stepNo === 1) {
    return <Step1 nextPage={nextPage} />;
  } else if (stepNo === 2) {
    return <Step2 title={title} options={options} nextPage={nextPage} />;
  } else if (stepNo === 3) {
    return <Step3 title={title} options={options} nextPage={nextPage} />;
  } else {
    return null;
  }
};

export default StepSelection;