/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ViewRoundPage from "../ViewRoundPage";
import { ProgressStatus, Round } from "../../api/types";
import {
  makeApprovedProjectData,
  makeQFDistribution,
  makeRoundData,
  wrapWithApplicationContext,
  wrapWithBulkUpdateGrantApplicationContext,
  wrapWithReadProgramContext,
  wrapWithRoundContext,
} from "../../../test-utils";
import { useDisconnect, useSwitchNetwork } from "wagmi";
import { useParams } from "react-router-dom";
import { faker } from "@faker-js/faker";
import { useRoundMatchData } from "../../api/api";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TextDecoder } = require("util");
global.TextDecoder = TextDecoder;

jest.mock("../../common/Auth");
jest.mock("wagmi");

jest.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: jest.fn(),
}));

let mockRoundData: Round = makeRoundData();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
}));

jest.mock("../../api/api", () => ({
  ...jest.requireActual("../../api/api"),
  useRoundMatchData: jest.fn(),
}));

jest.mock("../../common/Auth", () => ({
  useWallet: () => ({
    chain: {},
    address: mockRoundData.operatorWallets![0],
    provider: { getNetwork: () => ({ chainId: "0" }) },
  }),
}));

describe("View Funding Admin", () => {
  beforeEach(() => {
    (useParams as jest.Mock).mockImplementation(() => {
      return {
        id: mockRoundData.id,
      };
    });

    (useSwitchNetwork as jest.Mock).mockReturnValue({ chains: [] });
    (useDisconnect as jest.Mock).mockReturnValue({});
  });

  describe("display funding admin tab", () => {
    it("displays No Information Available before round end date", async () => {
      const roundEndTime = faker.date.future();
      mockRoundData = makeRoundData({ roundEndTime });
      render(
        wrapWithBulkUpdateGrantApplicationContext(
          wrapWithApplicationContext(
            wrapWithReadProgramContext(
              wrapWithRoundContext(<ViewRoundPage />, {
                data: [mockRoundData],
                fetchRoundStatus: ProgressStatus.IS_SUCCESS,
              }),
              { programs: [] }
            ),
            {
              applications: [],
              isLoading: false,
            }
          )
        )
      );
      const fundingAdminTab = screen.getByTestId("funding-admin");
      fireEvent.click(fundingAdminTab);
      expect(screen.getByText("No Information Available")).toBeInTheDocument();
    });

    it("displays matching stats table in funding admin page after round end date", async () => {
      (useRoundMatchData as jest.Mock).mockImplementation(() => ({
        return: {
          data: [makeQFDistribution(), makeQFDistribution()],
          error: null,
          loading: false,
        },
      }));

      const roundEndTime = faker.date.recent();
      const roundStartTime = faker.date.past(1, roundEndTime);
      const applicationsEndTime = faker.date.past(1, roundStartTime);
      const applicationsStartTime = faker.date.past(1, applicationsEndTime);

      const approvedProjects = [
        makeApprovedProjectData(),
        makeApprovedProjectData(),
        makeApprovedProjectData(),
      ];
      mockRoundData = makeRoundData({
        applicationsStartTime,
        applicationsEndTime,
        roundStartTime,
        roundEndTime,
        approvedProjects,
      });
      render(
        wrapWithBulkUpdateGrantApplicationContext(
          wrapWithApplicationContext(
            wrapWithReadProgramContext(
              wrapWithRoundContext(<ViewRoundPage />, {
                data: [mockRoundData],
                fetchRoundStatus: ProgressStatus.IS_SUCCESS,
              })
            )
          )
        )
      );
      const fundingAdminTab = screen.getByTestId("funding-admin");
      fireEvent.click(fundingAdminTab);
      expect(screen.getByTestId("match-stats-title")).toBeInTheDocument();
      expect(screen.getByTestId("matching-stats-table")).toBeInTheDocument();
      expect(
        screen.getByTestId("custom-or-default-test-id")
      ).toBeInTheDocument();
    });
  });

  it("displays upload field when custom radio button is selected", () => {
    (useRoundMatchData as jest.Mock).mockImplementation(() => ({
      return: {
        data: [makeQFDistribution(), makeQFDistribution()],
        error: null,
        loading: false,
      },
    }));

    const roundEndTime = faker.date.recent();
    const roundStartTime = faker.date.past(1, roundEndTime);
    const applicationsEndTime = faker.date.past(1, roundStartTime);
    const applicationsStartTime = faker.date.past(1, applicationsEndTime);

    const approvedProjects = [
      makeApprovedProjectData(),
      makeApprovedProjectData(),
      makeApprovedProjectData(),
    ];
    mockRoundData = makeRoundData({
      applicationsStartTime,
      applicationsEndTime,
      roundStartTime,
      roundEndTime,
      approvedProjects,
    });
    render(
      wrapWithBulkUpdateGrantApplicationContext(
        wrapWithApplicationContext(
          wrapWithReadProgramContext(
            wrapWithRoundContext(<ViewRoundPage />, {
              data: [mockRoundData],
              fetchRoundStatus: ProgressStatus.IS_SUCCESS,
            })
          )
        )
      )
    );
    const fundingAdminTab = screen.getByTestId("funding-admin");
    fireEvent.click(fundingAdminTab);
    expect(screen.getByTestId("match-stats-title")).toBeInTheDocument();
    expect(screen.getByTestId("matching-stats-table")).toBeInTheDocument();
    expect(screen.getByTestId("custom-or-default-test-id")).toBeInTheDocument();

    const customRadioButton = screen.getByTestId("custom-radio-test-id");
    fireEvent.click(customRadioButton);
    expect(screen.getByTestId("dropzone")).toBeInTheDocument();
  });

  it("uploading invalid json file throws error", async () => {
    (useRoundMatchData as jest.Mock).mockImplementation(() => ({
      return: {
        data: [makeQFDistribution(), makeQFDistribution()],
        error: null,
        loading: false,
      },
    }));

    // mock file.arrayBuffer
    const mockFile = new File([""], "test.json", { type: "application/json" });
    const mockFileArrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(0));
    Object.defineProperty(mockFile, "arrayBuffer", {
      value: mockFileArrayBuffer,
    });

    // mock the text decoder
    const mockTextDecoder = jest.fn().mockReturnValue({
      decode: jest.fn().mockReturnValue(`
      [
        {
          "projectName":"test",
          "projectId":"0x37ad3db0b0bc56cea1909e6a6f21fd35453ef27f1d9a91e9edde75de10cc9cf8-0xebdb4156203c8b35b7a7c6f320786b98e5ac67c3",
          "uniqueContributorsCount":6202,
          "matchPoolPercentage":0.0560505703204296
         },
         {
          "projectName":"test",
          "projectId":"0x80ce1332dac2fd7b408ea6df4798e0b99fd973d05168d917126af0dcf4f99bc3-0xebdb4156203c8b35b7a7c6f320786b98e5ac67c3",
          "uniqueContributorsCount":4527,
          "matchPoolPercentage":0.04131448208874834}
      ]
      `),
    });
    Object.defineProperty(window, "TextDecoder", {
      value: mockTextDecoder,
    });

    const roundEndTime = faker.date.recent();
    const roundStartTime = faker.date.past(1, roundEndTime);
    const applicationsEndTime = faker.date.past(1, roundStartTime);
    const applicationsStartTime = faker.date.past(1, applicationsEndTime);

    const approvedProjects = [
      makeApprovedProjectData(),
      makeApprovedProjectData(),
      makeApprovedProjectData(),
    ];
    mockRoundData = makeRoundData({
      applicationsStartTime,
      applicationsEndTime,
      roundStartTime,
      roundEndTime,
      approvedProjects,
    });
    render(
      wrapWithBulkUpdateGrantApplicationContext(
        wrapWithApplicationContext(
          wrapWithReadProgramContext(
            wrapWithRoundContext(<ViewRoundPage />, {
              data: [mockRoundData],
              fetchRoundStatus: ProgressStatus.IS_SUCCESS,
            })
          )
        )
      )
    );
    const fundingAdminTab = screen.getByTestId("funding-admin");
    fireEvent.click(fundingAdminTab);
    expect(screen.getByTestId("match-stats-title")).toBeInTheDocument();
    expect(screen.getByTestId("matching-stats-table")).toBeInTheDocument();
    expect(screen.getByTestId("custom-or-default-test-id")).toBeInTheDocument();

    const customRadioButton = screen.getByTestId("custom-radio-test-id");
    fireEvent.click(customRadioButton);
    expect(screen.getByTestId("dropzone")).toBeInTheDocument();

    // test dropzone .json file upload
    const dropzone = screen.getByTestId("dropzone");
    fireEvent.drop(dropzone, { dataTransfer: { files: [mockFile] } });

    expect(mockFile.arrayBuffer).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId("project-id-mismatch")).toBeInTheDocument();
    });
  });

  it("does not upload an invalid json file when dropped in dropzone", async () => {
    (useRoundMatchData as jest.Mock).mockImplementation(() => ({
      return: {
        data: [makeQFDistribution(), makeQFDistribution()],
        error: null,
        loading: false,
      },
    }));

    // mock file.arrayBuffer
    const mockFile = new File(["{}"], "test.json", {
      type: "application/json",
    });
    const mockFileArrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(0));
    Object.defineProperty(mockFile, "arrayBuffer", {
      value: mockFileArrayBuffer,
    });

    // mock the text decoder
    const mockTextDecoder = jest.fn().mockReturnValue({
      decode: jest.fn().mockReturnValue(`
      [
        {
          "projectName":"test",
          "projectId":"0x37ad3db0b0bc56cea1909e6a6f21fd35453ef27f1d9a91e9edde75de10cc9cf8-0xebdb4156203c8b35b7a7c6f320786b98e5ac67c3",
          "uniqueContributorsCount":6202,
          "matchPoolPercentage":0.0560505703204296 
        }
      ]
      `),
    });
    Object.defineProperty(window, "TextDecoder", {
      value: mockTextDecoder,
    });

    const roundEndTime = faker.date.recent();
    const roundStartTime = faker.date.past(1, roundEndTime);
    const applicationsEndTime = faker.date.past(1, roundStartTime);
    const applicationsStartTime = faker.date.past(1, applicationsEndTime);

    const approvedProjects = [
      makeApprovedProjectData(),
      makeApprovedProjectData(),
      makeApprovedProjectData(),
    ];
    mockRoundData = makeRoundData({
      applicationsStartTime,
      applicationsEndTime,
      roundStartTime,
      roundEndTime,
      approvedProjects,
    });
    render(
      wrapWithBulkUpdateGrantApplicationContext(
        wrapWithApplicationContext(
          wrapWithReadProgramContext(
            wrapWithRoundContext(<ViewRoundPage />, {
              data: [mockRoundData],
              fetchRoundStatus: ProgressStatus.IS_SUCCESS,
            })
          )
        )
      )
    );
    const fundingAdminTab = screen.getByTestId("funding-admin");
    fireEvent.click(fundingAdminTab);
    expect(screen.getByTestId("match-stats-title")).toBeInTheDocument();
    expect(screen.getByTestId("matching-stats-table")).toBeInTheDocument();
    expect(screen.getByTestId("custom-or-default-test-id")).toBeInTheDocument();

    const customRadioButton = screen.getByTestId("custom-radio-test-id");
    fireEvent.click(customRadioButton);
    expect(screen.getByTestId("dropzone")).toBeInTheDocument();

    // test dropzone .json file upload
    const dropzone = screen.getByTestId("dropzone");
    fireEvent.drop(dropzone, { dataTransfer: { files: [mockFile] } });

    expect(mockFile.arrayBuffer).toHaveBeenCalled();

    // expect the table to not be rendered
    await waitFor(() => {
      expect(
        screen.queryByTestId("matching-stats-table")
      ).not.toBeInTheDocument();
    });
  });
});
