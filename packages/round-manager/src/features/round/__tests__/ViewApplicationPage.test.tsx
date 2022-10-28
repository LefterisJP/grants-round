/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  makeGrantApplicationData,
  MakeGrantApplicationDataParams,
  makeRoundData,
} from "../../../test-utils";
import ViewApplicationPage from "../ViewApplicationPage";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useDisconnect, useSwitchNetwork } from "wagmi";
import { PassportVerifier } from "@gitcoinco/passport-sdk-verifier";
import {
  ApplicationContext,
  ApplicationState,
  initialApplicationState,
} from "../../../context/application/ApplicationContext";
import { MemoryRouter } from "react-router-dom";
import {
  getApplicationById,
  updateApplicationList,
  updateRoundContract,
} from "../../api/application";
import { faker } from "@faker-js/faker";
import { RoundContext } from "../../../context/round/RoundContext";
import { useWallet } from "../../common/Auth";
import { humanReadableLabels } from "../../api/utils";
import {
  BulkUpdateGrantApplicationContext,
  initialBulkUpdateGrantApplicationState,
} from "../../../context/application/BulkUpdateGrantApplicationContext";
import {
  ApplicationStatus,
  GrantApplication,
  ProgressStatus,
} from "../../api/types";
import { getMockWallet } from "../../common/__mocks__/Auth";

jest.mock("../../api/application");
jest.mock("../../common/Auth");

const mockAddress = "0x0";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    id: "some-application-id",
    roundId: "some-round-id",
  }),
}));

const applicationIdOverride = "some-application-id";
const roundIdOverride = "some-round-id";

jest.mock("@gitcoinco/passport-sdk-verifier");
jest.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: jest.fn(),
}));
jest.mock("wagmi");

const verifyCredentialMock = jest.spyOn(
  PassportVerifier.prototype,
  "verifyCredential"
);

describe("ViewApplicationPage", () => {
  beforeEach(() => {
    (useWallet as jest.Mock).mockReturnValue(
      getMockWallet({ addressToUse: mockAddress })
    );
    (useSwitchNetwork as any).mockReturnValue({ chains: [] });
    (useDisconnect as any).mockReturnValue({});
  });

  it("should display 404 when there no application is found", () => {
    (getApplicationById as jest.Mock).mockRejectedValue("No application :(");

    renderWithContext(<ViewApplicationPage />, {
      applications: [],
      isLoading: false,
      getApplicationByIdError: new Error("No application :("),
    });

    expect(screen.getByText("404 ERROR")).toBeInTheDocument();
    expect(screen.queryByText("Access Denied!")).not.toBeInTheDocument();
  });

  it("should display access denied when wallet accessing is not round operator", () => {
    const application = makeGrantApplicationData({ applicationIdOverride });
    (getApplicationById as any).mockResolvedValue(application);
    const wrongAddress = faker.finance.ethereumAddress();
    (useWallet as jest.Mock).mockReturnValue(
      getMockWallet({ addressToUse: wrongAddress })
    );

    renderWithContext(<ViewApplicationPage />, { applications: [application] });
    expect(screen.getByText("Access Denied!")).toBeInTheDocument();
    expect(screen.queryByText("404 ERROR")).not.toBeInTheDocument();
  });

  it("should display project's application answers", async () => {
    const expectedAnswers = Object.entries(humanReadableLabels).map(
      ([_, questionLabel], index) => ({
        questionId: index,
        question: questionLabel,
        answer: `My ${questionLabel} is ${faker.random.word()}`,
      })
    );

    const grantApplicationWithApplicationAnswers = makeGrantApplicationData({
      applicationIdOverride,
      applicationAnswers: expectedAnswers,
    });

    (getApplicationById as any).mockResolvedValue(
      grantApplicationWithApplicationAnswers
    );

    renderWithContext(<ViewApplicationPage />, {
      applications: [grantApplicationWithApplicationAnswers],
    });

    expect(
      await screen.findByText(expectedAnswers[0].answer)
    ).toBeInTheDocument();
  });

  describe("when approve or reject decision is selected", () => {
    let application: GrantApplication;

    beforeEach(() => {
      jest.clearAllMocks();
      application = makeGrantApplicationData({
        applicationIdOverride,
        roundIdOverride,
      });
      (getApplicationById as any).mockResolvedValue(application);
    });

    it("should open confirmation modal when approve is clicked", async () => {
      renderWithContext(<ViewApplicationPage />, {
        applications: [application],
      });
      fireEvent.click(screen.getByText(/Approve/));

      expect(await screen.findByTestId("confirm-modal")).toBeInTheDocument();
    });

    it("should open confirmation modal when reject is clicked", async () => {
      renderWithContext(<ViewApplicationPage />, {
        applications: [application],
      });
      fireEvent.click(screen.getByText(/Reject/));

      expect(await screen.findByTestId("confirm-modal")).toBeInTheDocument();
    });

    it("should start the bulk update process to persist approve decision when confirm is selected", async () => {
      (updateApplicationList as jest.Mock).mockResolvedValue("");
      (updateRoundContract as jest.Mock).mockReturnValue(
        new Promise(() => {
          /* do nothing */
        })
      );

      renderWithContext(<ViewApplicationPage />, {
        applications: [application],
      });
      fireEvent.click(screen.getByText(/Approve/));
      await screen.findByTestId("confirm-modal");
      fireEvent.click(screen.getByText("Confirm"));

      await waitFor(() => {
        expect(updateApplicationList).toBeCalled();
      });

      await waitFor(() => {
        expect(updateRoundContract).toBeCalled();
      });

      const expected = {
        id: application.id,
        round: application.round,
        recipient: application.recipient,
        projectsMetaPtr: application.projectsMetaPtr,
        status: ApplicationStatus.APPROVED,
      };
      expect(updateApplicationList).toBeCalled();
      const updateApplicationListFirstCall = (
        updateApplicationList as jest.Mock
      ).mock.calls[0];
      const actualApplicationsUpdated = updateApplicationListFirstCall[0];
      expect(actualApplicationsUpdated).toEqual([expected]);

      expect(updateRoundContract).toBeCalled();
      const updateRoundContractFirstCall = (updateRoundContract as jest.Mock)
        .mock.calls[0];
      const actualRoundId = updateRoundContractFirstCall[0];
      expect(actualRoundId).toEqual(roundIdOverride);
    });

    it("should close the confirmation modal when cancel is selected", async () => {
      renderWithContext(<ViewApplicationPage />, {
        applications: [application],
      });
      fireEvent.click(screen.getByText(/Approve/));
      await screen.findByTestId("confirm-modal");
      fireEvent.click(screen.getByText("Cancel"));

      await waitFor(() => {
        expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
      });
    });
  });
});

describe("ViewApplicationPage verification badges", () => {
  beforeEach(() => {
    (useWallet as jest.Mock).mockReturnValue(
      getMockWallet({ addressToUse: mockAddress })
    );
    (useSwitchNetwork as any).mockReturnValue({ chains: [] });
    (useDisconnect as any).mockReturnValue({});
  });

  it("shows project twitter with no badge when there is no credential", async () => {
    const provider = "twitter";
    verifyCredentialMock.mockResolvedValue(true);
    const expectedTwitterHandle = faker.random.word();
    const grantApplicationWithNoVc = makeGrantApplicationData({
      applicationIdOverride,
      projectTwitterOverride: expectedTwitterHandle,
    });

    grantApplicationWithNoVc.project!.credentials = {};
    (getApplicationById as any).mockResolvedValue(grantApplicationWithNoVc);

    renderWithContext(<ViewApplicationPage />, {
      applications: [grantApplicationWithNoVc],
    });

    expect(await screen.findByText(expectedTwitterHandle)).toBeInTheDocument();
    expect(
      screen.queryByTestId(`${provider}-verifiable-credential`)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`${provider}-verifiable-credential-unverified`)
    ).not.toBeInTheDocument();
  });

  it("shows project github organization with no badge when there is no credential", async () => {
    const provider = "github";
    verifyCredentialMock.mockResolvedValue(true);
    const expectedGithubOrganizationName = faker.random.word();
    const grantApplicationWithNoVc = makeGrantApplicationData({
      applicationIdOverride,
      projectGithubOverride: expectedGithubOrganizationName,
    });
    grantApplicationWithNoVc.project!.credentials = {};
    (getApplicationById as any).mockResolvedValue(grantApplicationWithNoVc);

    renderWithContext(<ViewApplicationPage />, {
      applications: [grantApplicationWithNoVc],
    });

    expect(
      await screen.findByText(expectedGithubOrganizationName)
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(`${provider}-verifiable-credential`)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`${provider}-verifiable-credential-unverified`)
    ).not.toBeInTheDocument();
  });

  it.each([
    ["github", { projectGithubOverride: "some github handle" }],
    ["twitter", { projectTwitterOverride: "some twitter handle" }],
  ])(
    "shows project %s verification when you have a valid verifiable credential for it",
    async (provider: string, overrides: MakeGrantApplicationDataParams) => {
      verifyCredentialMock.mockResolvedValue(true);
      const grantApplicationWithValidVc = makeGrantApplicationData({
        applicationIdOverride,
        ...overrides,
      });
      (getApplicationById as any).mockResolvedValue(
        grantApplicationWithValidVc
      );

      renderWithContext(<ViewApplicationPage />, {
        applications: [grantApplicationWithValidVc],
      });

      expect(
        await screen.findByTestId(`${provider}-verifiable-credential`)
      ).toBeInTheDocument();
    }
  );

  it("shows verified twitter badge when project twitter handle matches vc regardless of casing", async () => {
    const provider = "twitter";
    const handle = "someHandle";
    verifyCredentialMock.mockResolvedValue(true);
    const grantApplication = makeGrantApplicationData({
      applicationIdOverride,
      projectTwitterOverride: handle.toLowerCase(),
    });
    grantApplication.project!.projectTwitter = handle.toUpperCase();
    (getApplicationById as any).mockResolvedValue(grantApplication);

    renderWithContext(<ViewApplicationPage />, {
      applications: [grantApplication],
    });

    await waitFor(() => {
      expect(
        screen.getByTestId(`${provider}-verifiable-credential`)
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId(`${provider}-verifiable-credential-unverified`)
    ).not.toBeInTheDocument();
  });

  it("shows verified github badge when project github handle matches vc regardless of casing", async () => {
    const provider = "github";
    const handle = "someHandle";
    verifyCredentialMock.mockResolvedValue(true);
    const grantApplication = makeGrantApplicationData({
      applicationIdOverride,
      projectGithubOverride: handle.toLowerCase(),
    });
    grantApplication.project!.projectGithub = handle.toUpperCase();
    (getApplicationById as any).mockResolvedValue(grantApplication);

    renderWithContext(<ViewApplicationPage />, {
      applications: [grantApplication],
    });

    await waitFor(() => {
      expect(
        screen.getByTestId(`${provider}-verifiable-credential`)
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId(`${provider}-verifiable-credential-unverified`)
    ).not.toBeInTheDocument();
  });

  it.each([
    ["github", { projectGithubOverride: "some github handle" }],
    ["twitter", { projectTwitterOverride: "some twitter handle" }],
  ])(
    "shows no project %s verification when you have an invalid verifiable credential for it",
    async (provider: string, overrides: MakeGrantApplicationDataParams) => {
      verifyCredentialMock.mockResolvedValue(false);
      const grantApplicationStub = makeGrantApplicationData({
        applicationIdOverride,
        ...overrides,
      });
      (getApplicationById as any).mockResolvedValue(grantApplicationStub);

      renderWithContext(<ViewApplicationPage />, {
        applications: [grantApplicationStub],
        isLoading: false,
      });

      await waitFor(() => {
        expect(
          screen.getByTestId(`${provider}-verifiable-credential-unverified`)
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId(`${provider}-verifiable-credential`)
      ).not.toBeInTheDocument();
    }
  );

  it.each(["github", "twitter"])(
    "shows no project %s verification when you do not have a verifiable credential for it",
    async (provider) => {
      const noGithubVerification = {
        application: makeGrantApplicationData({
          applicationIdOverride,
        }),
        isLoading: false,
      };
      (getApplicationById as any).mockResolvedValue(
        noGithubVerification.application
      );

      renderWithContext(<ViewApplicationPage />, noGithubVerification);

      expect(
        screen.queryByTestId(`${provider}-verifiable-credential`)
      ).not.toBeInTheDocument();
    }
  );

  it("shows invalid badge when verifiable credential was not issued by correct IAM server", async () => {
    verifyCredentialMock.mockResolvedValue(true);
    const fakeIssuer =
      "did:key:z6Mks2YNwbkzDgKLuQs1TS3whP9RdXrGXtVqt5JcCLoQu86W";
    const grantApplication = makeGrantApplicationData({
      applicationIdOverride,
      projectGithubOverride: "whatever",
    });
    grantApplication.project!.credentials["github"].issuer = fakeIssuer;
    (getApplicationById as any).mockResolvedValue(grantApplication);

    renderWithContext(<ViewApplicationPage />, {
      applications: [grantApplication],
    });

    await waitFor(() => {
      expect(
        screen.getByTestId(`github-verifiable-credential-unverified`)
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId(`github-verifiable-credential`)
    ).not.toBeInTheDocument();
  });

  it("shows no twitter badge when project twitter handle does not match verifiable credential", async () => {
    const provider = "twitter";
    const handle = "someHandle";
    verifyCredentialMock.mockResolvedValue(true);
    const grantApplication = makeGrantApplicationData({
      applicationIdOverride,
      projectTwitterOverride: handle,
    });
    grantApplication.project!.projectTwitter = "not some handle";
    (getApplicationById as any).mockResolvedValue(grantApplication);

    renderWithContext(<ViewApplicationPage />, {
      applications: [grantApplication],
    });

    await waitFor(() => {
      expect(
        screen.getByTestId(`${provider}-verifiable-credential-unverified`)
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId(`${provider}-verifiable-credential`)
    ).not.toBeInTheDocument();
  });

  it("shows no github badge when project github handle does not match verifiable credential", async () => {
    const provider = "github";
    const handle = "someHandle";
    verifyCredentialMock.mockResolvedValue(true);
    const grantApplication = makeGrantApplicationData({
      applicationIdOverride,
      projectGithubOverride: handle,
    });
    grantApplication.project!.projectGithub = "not some handle";
    (getApplicationById as any).mockResolvedValue(grantApplication);

    renderWithContext(<ViewApplicationPage />, {
      applications: [grantApplication],
    });

    await waitFor(() => {
      expect(
        screen.getByTestId(`${provider}-verifiable-credential-unverified`)
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId(`${provider}-verifiable-credential`)
    ).not.toBeInTheDocument();
  });

  it.each([
    ["github", { projectGithubOverride: "some github" }],
    ["twitter", { projectTwitterOverride: "some twitter" }],
  ])(
    "shows invalid $provider badge when project owner address does not match vc",
    async (provider, overrides: MakeGrantApplicationDataParams) => {
      verifyCredentialMock.mockResolvedValue(true);
      const grantApplicationData = makeGrantApplicationData({
        applicationIdOverride,
        ...overrides,
      });
      grantApplicationData.project!.owners.forEach((it) => {
        it.address = "bad";
      });
      (getApplicationById as any).mockResolvedValue(grantApplicationData);

      renderWithContext(<ViewApplicationPage />, {
        applications: [grantApplicationData],
      });

      await screen.findByTestId(`${provider}-verifiable-credential-unverified`);
      expect(
        screen.queryByTestId(`${provider}-verifiable-credential`)
      ).not.toBeInTheDocument();
    }
  );
});

export const renderWithContext = (
  ui: JSX.Element,
  applicationStateOverrides: Partial<ApplicationState> = {},
  dispatch: any = jest.fn()
) =>
  render(
    <MemoryRouter>
      <BulkUpdateGrantApplicationContext.Provider
        value={initialBulkUpdateGrantApplicationState}
      >
        <RoundContext.Provider
          value={{
            state: {
              data: [
                makeRoundData({
                  id: roundIdOverride,
                  operatorWallets: [mockAddress],
                }),
              ],
              fetchRoundStatus: ProgressStatus.IS_SUCCESS,
            },
            dispatch,
          }}
        >
          <ApplicationContext.Provider
            value={{
              state: {
                ...initialApplicationState,
                ...applicationStateOverrides,
              },
              dispatch,
            }}
          >
            {ui}
          </ApplicationContext.Provider>
        </RoundContext.Provider>
      </BulkUpdateGrantApplicationContext.Provider>
    </MemoryRouter>
  );
