import CreateRoundPage from "../CreateRoundPage";
import { makeProgramData, renderWithProgramContext } from "../../../test-utils";
import { faker } from "@faker-js/faker";
import { RoundDetailForm } from "../RoundDetailForm";
import ApplicationEligibilityForm from "../ApplicationEligibilityForm";
import { RoundApplicationForm } from "../RoundApplicationForm";
import * as FormWizardImport from "../../common/FormWizard";
import { fireEvent, screen } from "@testing-library/react";
import { mockWallet } from "../../common/__mocks__/Auth";

jest.mock("../../common/Navbar");
jest.mock("../../common/Auth", () => ({
  useWallet: () => mockWallet,
}));
const formWizardSpy = jest.spyOn(FormWizardImport, "FormWizard");

const programId = faker.finance.ethereumAddress();
const useParamsFn = () => [
  {
    get: () => programId,
  },
];
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useSearchParams: useParamsFn,
}));

describe("<CreateRoundPage />", () => {
  it("sends program to form wizard", () => {
    const programs = [makeProgramData({ id: programId })];

    renderWithProgramContext(<CreateRoundPage />, { programs });

    const firstFormWizardCall = formWizardSpy.mock.calls[0];
    const firstCallArgument = firstFormWizardCall[0];
    expect(firstCallArgument).toMatchObject({
      steps: [
        RoundDetailForm,
        ApplicationEligibilityForm,
        RoundApplicationForm,
      ],
      initialData: { program: programs[0] },
    });
  });

  it("exit button redirects to home", async () => {
    const programs = [makeProgramData({ id: programId })];

    renderWithProgramContext(<CreateRoundPage />, { programs });

    const exitButton = await screen.findByText("Exit");
    expect(exitButton).toBeTruthy();
    fireEvent.click(exitButton);
    expect(window.location.pathname).toBe("/");
  });

  it("sends program matching search query to form wizard", () => {
    const programToChoose = makeProgramData({ id: programId });
    const programs = [makeProgramData(), programToChoose, makeProgramData()];

    renderWithProgramContext(<CreateRoundPage />, { programs });

    const firstFormWizardCall = formWizardSpy.mock.calls[0];
    const firstCallArgument = firstFormWizardCall[0];
    expect(firstCallArgument).toMatchObject({
      steps: [
        RoundDetailForm,
        ApplicationEligibilityForm,
        RoundApplicationForm,
      ],
      initialData: { program: programToChoose },
    });
  });
});
