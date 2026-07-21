export type RaftRole = "follower" | "candidate" | "leader";

export interface RaftMessage {
  id: string;
  senderId: string;
  receiverId: string;
  type: "RequestVote" | "RequestVoteResponse" | "AppendEntries" | "AppendEntriesResponse";
  term: number;
  payload: { granted?: boolean; success?: boolean };
}

export class RaftNode {
  id: string;
  role: RaftRole = "follower";
  currentTerm: number = 0;
  votedFor: string | null = null;
  isAlive: boolean = true;

  // Timeouts measured in logical ticks
  electionTimeout: number = 0;
  heartbeatTimeout: number = 0;

  minElectionTimeout: number;
  maxElectionTimeout: number;
  heartbeatInterval: number = 10; // heartbeat tick frequency

  votesReceived: Set<string> = new Set();

  constructor(id: string, minTimeoutTicks = 15, maxTimeoutTicks = 30) {
    this.id = id;
    this.minElectionTimeout = minTimeoutTicks;
    this.maxElectionTimeout = maxTimeoutTicks;
    this.resetElectionTimeout();
  }

  resetElectionTimeout() {
    this.electionTimeout = Math.floor(
      this.minElectionTimeout + Math.random() * (this.maxElectionTimeout - this.minElectionTimeout)
    );
  }

  resetHeartbeatTimeout() {
    this.heartbeatTimeout = this.heartbeatInterval;
  }
}

export class RaftCluster {
  nodes: Map<string, RaftNode> = new Map();
  messages: RaftMessage[] = [];
  partitions: string[][] = [];
  messageIdCounter = 0;

  constructor(nodeIds: string[]) {
    nodeIds.forEach((id) => {
      this.nodes.set(id, new RaftNode(id, 20, 40));
    });
    this.partitions = [nodeIds];
  }

  setPartitions(groups: string[][]) {
    this.partitions = groups;
  }

  areConnected(id1: string, id2: string): boolean {
    return this.partitions.some((group) => group.includes(id1) && group.includes(id2));
  }

  getPartitionGroup(nodeId: string): string[] {
    return this.partitions.find((group) => group.includes(nodeId)) || [];
  }

  tick() {
    // Process messages in-flight
    const incomingMessages = [...this.messages];
    this.messages = [];

    incomingMessages.forEach((msg) => {
      const sender = this.nodes.get(msg.senderId);
      const receiver = this.nodes.get(msg.receiverId);

      if (
        sender?.isAlive &&
        receiver?.isAlive &&
        this.areConnected(msg.senderId, msg.receiverId)
      ) {
        this.handleMessage(msg, receiver);
      }
    });

    // Tick timeouts
    this.nodes.forEach((node) => {
      if (!node.isAlive) return;

      if (node.role === "leader") {
        node.heartbeatTimeout--;
        if (node.heartbeatTimeout <= 0) {
          this.sendHeartbeats(node);
        }
      } else {
        node.electionTimeout--;
        if (node.electionTimeout <= 0) {
          this.startElection(node);
        }
      }
    });
  }

  handleMessage(msg: RaftMessage, receiver: RaftNode) {
    // Term updates: step down if message term is larger
    if (msg.term > receiver.currentTerm) {
      receiver.currentTerm = msg.term;
      receiver.role = "follower";
      receiver.votedFor = null;
      receiver.resetElectionTimeout();
    }

    if (msg.type === "RequestVote") {
      const grantVote =
        msg.term === receiver.currentTerm &&
        (receiver.votedFor === null || receiver.votedFor === msg.senderId);

      if (grantVote) {
        receiver.votedFor = msg.senderId;
        receiver.resetElectionTimeout();
      }

      this.sendMessage({
        id: `msg-${this.messageIdCounter++}`,
        senderId: receiver.id,
        receiverId: msg.senderId,
        type: "RequestVoteResponse",
        term: receiver.currentTerm,
        payload: { granted: grantVote },
      });
    } else if (msg.type === "RequestVoteResponse") {
      if (
        receiver.role === "candidate" &&
        msg.term === receiver.currentTerm &&
        msg.payload.granted
      ) {
        receiver.votesReceived.add(msg.senderId);

        const partitionGroup = this.getPartitionGroup(receiver.id);
        const totalQuorum = Math.floor(this.nodes.size / 2) + 1; // absolute majority (3 for 5 nodes)

        const partitionVotes = Array.from(receiver.votesReceived).filter((id) =>
          partitionGroup.includes(id)
        );

        if (partitionVotes.length >= totalQuorum) {
          receiver.role = "leader";
          receiver.resetHeartbeatTimeout();
          this.sendHeartbeats(receiver);
        }
      }
    } else if (msg.type === "AppendEntries") {
      if (msg.term === receiver.currentTerm) {
        if (receiver.role === "candidate") {
          receiver.role = "follower";
        }
        receiver.resetElectionTimeout();
      }

      this.sendMessage({
        id: `msg-${this.messageIdCounter++}`,
        senderId: receiver.id,
        receiverId: msg.senderId,
        type: "AppendEntriesResponse",
        term: receiver.currentTerm,
        payload: { success: msg.term === receiver.currentTerm },
      });
    }
  }

  sendMessage(msg: RaftMessage) {
    this.messages.push(msg);
  }

  startElection(node: RaftNode) {
    node.role = "candidate";
    node.currentTerm++;
    node.votedFor = node.id;
    node.votesReceived.clear();
    node.votesReceived.add(node.id);
    node.resetElectionTimeout();

    this.nodes.forEach((other) => {
      if (other.id !== node.id) {
        this.sendMessage({
          id: `msg-${this.messageIdCounter++}`,
          senderId: node.id,
          receiverId: other.id,
          type: "RequestVote",
          term: node.currentTerm,
          payload: {},
        });
      }
    });
  }

  sendHeartbeats(leader: RaftNode) {
    leader.resetHeartbeatTimeout();
    this.nodes.forEach((other) => {
      if (other.id !== leader.id) {
        this.sendMessage({
          id: `msg-${this.messageIdCounter++}`,
          senderId: leader.id,
          receiverId: other.id,
          type: "AppendEntries",
          term: leader.currentTerm,
          payload: {},
        });
      }
    });
  }
}
