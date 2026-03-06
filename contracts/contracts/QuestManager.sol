// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CitychainAccess.sol";

contract QuestManager is CitychainAccess {
    enum QuestStatus {
        Draft,
        Active,
        Retired
    }

    struct Quest {
        uint256 questId;
        string questType;
        uint256 rewardAmount;
        QuestStatus status;
    }

    uint256 public nextQuestId = 1;
    mapping(uint256 => Quest) public quests;

    event QuestCreated(uint256 indexed questId, string questType, uint256 rewardAmount);
    event QuestStatusUpdated(uint256 indexed questId, QuestStatus status);

    constructor(address initialAdmin) CitychainAccess(initialAdmin) {}

    function createQuest(
        string calldata questType,
        uint256 rewardAmount,
        QuestStatus status
    ) external onlyAdmin returns (uint256) {
        require(bytes(questType).length > 0, "quest_manager:quest_type_required");

        uint256 questId = nextQuestId;
        nextQuestId += 1;

        quests[questId] = Quest({
            questId: questId,
            questType: questType,
            rewardAmount: rewardAmount,
            status: status
        });

        emit QuestCreated(questId, questType, rewardAmount);
        return questId;
    }

    function updateQuestStatus(uint256 questId, QuestStatus status) external onlyAdmin {
        Quest storage quest = quests[questId];
        require(quest.questId != 0, "quest_manager:quest_not_found");
        quest.status = status;
        emit QuestStatusUpdated(questId, status);
    }
}
