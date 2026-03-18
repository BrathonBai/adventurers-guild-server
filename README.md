# Agent Interoperability Protocol (AIP)

> **A lightweight learning project exploring AI Agent communication**

[![License: CC0](https://img.shields.io/badge/License-CC0-blue.svg)](https://creativecommons.org/publicdomain/zero/1.0/)
[![Status: Learning Project](https://img.shields.io/badge/Status-Learning%20Project-blue.svg)]()

English | [简体中文](./README_CN.md)

## ⚠️ Important Note

**This is a learning project.** After starting this project, we discovered [Google's A2A Protocol](https://github.com/google/A2A), which is a mature, production-ready solution backed by the Linux Foundation.

**We recommend using Google A2A for production use.**

This project will continue as:
- 📚 A learning resource for understanding agent communication
- 🔬 A lightweight experimental implementation
- 🎯 A foundation for building simplified agent systems

We will reference Google A2A's design and potentially create a lightweight version suitable for specific use cases.

---

## 🎯 Vision

Imagine a world where AI Agents from different platforms can discover each other, communicate, and collaborate seamlessly—just like humans do across different companies and organizations.

**Agent Interoperability Protocol (AIP)** explores this possibility through a simple, educational implementation.

## 🚀 Quick Demo

```typescript
// Agent 1: CodeWizard (Coding Expert)
const codingAgent = new AIPAgent({
  name: 'CodeWizard',
  capabilities: [{ type: 'coding', skills: ['typescript', 'react'] }],
});

await codingAgent.connect('wss://platform.example.com/aip');

// Agent 2: DesignMaster (Design Expert)
const designAgent = new AIPAgent({
  name: 'DesignMaster',
  capabilities: [{ type: 'design', skills: ['figma', 'ui-design'] }],
});

await designAgent.connect('wss://platform.example.com/aip');

// CodeWizard sends collaboration request
codingAgent.sendMessage(designAgent.id, 'collaboration_request', {
  message: 'Need help with UI design for a React project',
  budget: 500,
});

// DesignMaster responds
designAgent.on('messageReceived', (msg) => {
  if (msg.type === 'collaboration_request') {
    designAgent.sendMessage(msg.from, 'collaboration_response', {
      message: 'I can help! Let\'s do it.',
      accepted: true,
    });
  }
});
```

**Result**: Two agents from potentially different platforms just formed a team! 🤝

## 🌟 Why This Project?

### Learning Goals

This project was created to:
- 📚 **Understand** agent communication patterns
- 🔬 **Experiment** with WebSocket-based agent messaging
- 🎓 **Learn** protocol design principles
- 🛠️ **Build** a working prototype from scratch

### Comparison with Google A2A

After starting this project, we discovered [Google's A2A Protocol](https://github.com/google/A2A), which is far more mature:

| Feature | AIP (This Project) | Google A2A |
|---------|-------------------|------------|
| **Maturity** | Learning prototype | Production-ready |
| **Backing** | Individual project | Linux Foundation |
| **SDKs** | TypeScript only | Python, Go, JS, Java, .NET |
| **Protocol** | Custom JSON | Protocol Buffers + JSON-RPC 2.0 |
| **Enterprise** | ❌ | ✅ (Auth, Security, Observability) |
| **Documentation** | Basic | Comprehensive + DeepLearning.AI course |
| **Use Case** | Learning & experimentation | Production systems |

**Recommendation**: For production use, please use [Google A2A](https://github.com/google/A2A).

### Our Focus Going Forward

This project will evolve into:
1. **Educational Resource** - Simple examples for learning agent communication
2. **Lightweight Alternative** - Minimal implementation for specific use cases
3. **Experimentation Platform** - Testing ideas before implementing in A2A
4. **Bridge to A2A** - Potentially create simplified wrappers around Google A2A

## 📦 What's Included

This repository contains:

1. **Protocol Specification** ([RFC_AIP.md](./RFC_AIP.md))
2. **Reference Implementation** (TypeScript)
   - Agent SDK (`agent-sdk/`)
   - WebSocket Server (`server/`)
3. **Working Demo** (`test-a2a.js`)
4. **Documentation** (this README + implementation guide)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AIP Ecosystem                         │
│                                                          │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐      │
│  │Platform A│      │Platform B│      │Platform C│      │
│  │          │      │          │      │          │      │
│  │ Agent 1  │◄────►│ Agent 2  │◄────►│ Agent 3  │      │
│  │ Agent 4  │      │ Agent 5  │      │ Agent 6  │      │
│  └──────────┘      └──────────┘      └──────────┘      │
│       │                  │                  │           │
│       └──────────────────┼──────────────────┘           │
│                          │                              │
│                   ┌──────▼──────┐                       │
│                   │ AIP Network │                       │
│                   │  (WebSocket) │                       │
│                   └─────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/aip-protocol.git
cd aip-protocol

# Install dependencies
npm install

# Build the SDK
cd agent-sdk && npm install && npm run build && cd ..

# Build the server
cd server && npm install && npm run build && cd ..
```

### Run the Demo

```bash
# Terminal 1: Start the server
cd server
npm run dev

# Terminal 2: Run the demo
cd ..
node test-a2a.js
```

You'll see two agents (CodeWizard and DesignMaster) connect, communicate, and collaborate!

## 📖 Protocol Overview

### 1. Agent Identity

Every agent has a unique DID (Decentralized Identifier):

```
did:aip:platform:agent-id
```

### 2. Capability Declaration

Agents declare what they can do:

```json
{
  "type": "coding",
  "skills": ["typescript", "react", "nodejs"],
  "proficiency": 9,
  "proof": {
    "type": "portfolio",
    "url": "https://github.com/agent"
  }
}
```

### 3. Message Format

All messages follow a standard structure:

```json
{
  "id": "uuid",
  "from": "did:aip:platform:sender",
  "to": "did:aip:platform:receiver",
  "type": "message-type",
  "timestamp": 1710561600000,
  "data": { ... }
}
```

### 4. Message Types

- **Discovery**: `discover`, `announce`
- **Tasks**: `task_offer`, `task_accept`, `task_reject`, `task_progress`, `task_complete`
- **Communication**: `message`, `broadcast`, `collaboration_request`, `collaboration_response`
- **Reputation**: `reputation_query`, `reputation_update`

## 🎯 Use Cases

### 1. Cross-Platform Task Marketplace

A user posts a task on Platform A. Agents from Platform B and C can discover and bid on it.

### 2. Agent Teams

Multiple specialized agents collaborate:
- CodeWizard (coding)
- DesignMaster (design)
- TestBot (testing)

### 3. Human-Agent Delegation

A human has a personal agent that:
- Monitors task marketplaces
- Accepts tasks on behalf of the human
- Coordinates with other agents
- Reports back for approval

### 4. Reputation Portability

Build reputation on one platform, use it everywhere.

## 🛣️ Roadmap

- [x] **Phase 1**: Core protocol (message format, basic transport)
- [ ] **Phase 2**: Security (signing, encryption, authentication)
- [ ] **Phase 3**: Discovery (agent discovery, capability matching)
- [ ] **Phase 4**: Advanced features (task decomposition, payments)
- [ ] **Phase 5**: Decentralization (P2P, blockchain integration)

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Review** the [RFC](./RFC_AIP.md) and provide feedback
2. **Implement** the protocol in your platform
3. **Test** interoperability with other implementations
4. **Share** your use cases and ideas

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

- [Protocol Specification (RFC)](./RFC_AIP.md)
- [Implementation Guide](./A2A_IMPLEMENTATION.md)
- [API Reference](./docs/api-reference.md) (coming soon)
- [Examples](./examples/) (coming soon)

## 🌐 Community

- **GitHub**: [github.com/your-org/aip-protocol](https://github.com/your-org/aip-protocol)
- **Discord**: [discord.gg/aip-protocol](https://discord.gg/aip-protocol) (coming soon)
- **Twitter**: [@AIPProtocol](https://twitter.com/AIPProtocol) (coming soon)

## 📄 License

This specification is released under [CC0 (Public Domain)](https://creativecommons.org/publicdomain/zero/1.0/).

The reference implementation is released under [MIT License](./LICENSE).

## 🙏 Acknowledgments

This protocol was born from the [Adventurer's Guild](https://github.com/your-org/adventurers-guild) project—a platform where humans and AI agents work together as equals.

Special thanks to:
- **Brathon** - Project creator and visionary
- **ORION 🌌** - AI assistant and co-architect
- The open-source community for inspiration

## 🔗 Related Projects

### Production-Ready Solutions
- **[Google A2A Protocol](https://github.com/google/A2A)** ⭐ - The mature, production-ready agent communication protocol (Recommended for production use)
- [Google A2A Documentation](https://google.github.io/A2A/) - Official documentation and guides
- [DeepLearning.AI A2A Course](https://www.deeplearning.ai/) - Official course on using A2A

### Other Projects
- [Adventurer's Guild](https://github.com/BrathonBai/adventurers-guild) - The platform that inspired this project
- [OpenClaw](https://openclaw.ai) - AI agent orchestration framework
- [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) - Autonomous AI agents
- [LangChain](https://github.com/langchain-ai/langchain) - Building applications with LLMs

---

**Built with ❤️ by Brathon & ORION**

**Status**: 🎓 Learning Project - Exploring agent communication concepts

**For production use, please consider [Google A2A](https://github.com/google/A2A)**
