<script lang="ts">
  import { Label } from "$lib/components/ui/label";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { toast } from "svelte-sonner";
  import { Input } from "$lib/components/ui/input";
  import { Send } from "lucide-svelte";
  import { RefreshCcw } from "lucide-svelte";

  // Setup socket.io client
  import { io } from "socket.io-client";
  import { VtubeSocket } from "$lib";
  import { onMount } from "svelte";
  const socket = io("localhost:8080");
  socket.on("error", (data) => {
    console.log(data);
    toast.error(data);
  });

  let hotkeys: any[] = [];
  let expressions: string[] = [];
  let vtubeSocket: VtubeSocket;
  let modelStats: any = null;
  let bindedExpressions: any = [];
  let expression = "";
  let vtubeAuthenticated = false;

  onMount(() => {
    vtubeSocket = new VtubeSocket();

    vtubeSocket.onVtubeEvent((event) => {
      if (event.authenticated) {
        vtubeAuthenticated = true;
      }

      if (event?.messageType === "CurrentModelResponse") {
        modelStats = event.data;
      }

      if (event?.messageType === "HotkeysInCurrentModelResponse") {
        hotkeys = event.data.availableHotkeys;
      }
    });
  });

  socket.on("get_hotkeys", (data) => {
    hotkeys = data;
  });

  socket.on("current_message", (data: string) => {
    if (!vtubeAuthenticated) return;

    for (const binded of bindedExpressions) {
      if (data.toLocaleLowerCase().includes(binded.expression)) {
        console.log("detected binding");
        vtubeSocket.vtubeMessage("HotkeyTriggerRequest", {
          hotkeyID: binded.hotkeyID,
        });
      }
    }
  });

  function retrieveCurrentModel() {
    if (vtubeAuthenticated) {
      vtubeSocket.vtubeMessage("CurrentModelRequest");
    }
  }

  function retrieveHotkeys() {
    if (vtubeAuthenticated && modelStats) {
      vtubeSocket.vtubeMessage("HotkeysInCurrentModelRequest", {
        modelID: modelStats.modelID,
      });
    }
  }

  function addExpression() {
    if (!expressions.includes(expression)) {
      expressions = [...expressions, expression];
    }
    expression = "";
  }

  function bindExpressionHotkey(event: SubmitEvent) {
    const data = new FormData(event.target as HTMLFormElement);
    const hotkeyID = data.get("hotkeyID") as string;
    const expression = data.get("expression") as string;

    const hotkey = hotkeys.find((hotkey) => hotkey.hotkeyID === hotkeyID);

    bindedExpressions = [...bindedExpressions, { hotkeyID, expression, name: hotkey?.name }];
  }

  // Send hotkey
  function sendHotkey(hotkeyID: string) {
    if (vtubeAuthenticated) {
      vtubeSocket.vtubeMessage("HotkeyTriggerRequest", {
        hotkeyID,
      });
    }
  }

  //Send Prop Action
  function triggerProp(prop_action: string) {
    socket.emit("trigger_prop", prop_action);
  }

  //Move Model
  function moveModel(mode: string) {
    socket.emit("move_model", mode);
  }
</script>

<div class="w-full h-full flex border-t-2">
  <div class="max-xl:w-1/2 items-start flex flex-wrap gap-[30px] p-5 xl:p-10">
    Authenticated: {vtubeAuthenticated}
    <br />
    {JSON.stringify(modelStats)}
    <Card.Root class="w-[480px]">
      <Card.Header>
        <Card.Title>Trigger Hotkeys</Card.Title>
        <Card.Description>Manually trigger Vtube Studio Hotkeys</Card.Description>
      </Card.Header>
      <Card.Content class="grow">
        <div class="flex flex-wrap gap-2.5">
          {#each hotkeys as hotkey}
            <Button
              on:click={() => {
                sendHotkey(hotkey.hotkeyID);
              }}
            >
              {hotkey.name}
            </Button>
          {/each}
        </div>
      </Card.Content>
      <Card.Footer>
        <Button variant="outline" on:click={retrieveHotkeys}>
          <RefreshCcw class="mr-2 w-4 h-4" />
          Refresh
        </Button>
      </Card.Footer>
    </Card.Root>
    <Card.Root class="w-[480px]">
      <Card.Header>
        <Card.Title>Props</Card.Title>
        <Card.Description>Animate props in and out</Card.Description>
      </Card.Header>
      <Card.Content class="grow">
        <div class="flex flex-wrap gap-2.5">
          <Button
            on:click={() => {
              triggerProp("spawn_microphone");
            }}
          >
            Spawn Microphone
          </Button>
          <Button
            on:click={() => {
              triggerProp("despawn_microphone");
            }}
          >
            Despawn Microphone
          </Button>
        </div>
      </Card.Content>
    </Card.Root>
    <Card.Root class="w-[480px]">
      <Card.Header>
        <Card.Title>Move Model</Card.Title>
        <Card.Description>Move the model to preset locations</Card.Description>
      </Card.Header>
      <Card.Content class="grow">
        <div class="flex flex-wrap gap-2.5">
          <Button
            on:click={() => {
              moveModel("chat");
            }}
          >
            Chatting
          </Button>
          <Button
            on:click={() => {
              moveModel("screen");
            }}
          >
            Full Screen
          </Button>
          <Button
            on:click={() => {
              moveModel("react");
            }}
          >
            Reacting
          </Button>

          <Button
            on:click={() => {
              retrieveCurrentModel();
            }}
          >
            Update Model
          </Button>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root class="w-[480px]">
      <Card.Header>
        <Card.Title>Keywords</Card.Title>
        <Card.Description>Add keywords for Vtube Studio</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="flex flex-wrap gap-2.5">
          {#each expressions as expression}
            <Label>{expression}</Label>
          {/each}
        </div>

        <br />

        <form on:submit|preventDefault={addExpression}>
          <Input placeholder="New Reaction" bind:value={expression} />
          <Button type="submit" size="icon">
            <Send class="h-4 w-4" />
          </Button>
        </form>
      </Card.Content>
    </Card.Root>

    <Card.Root class="w-[480px]">
      <Card.Header>
        <Card.Title>Hotkey Keywords</Card.Title>
        <Card.Description>Bind a keyword to a hotkey</Card.Description>
      </Card.Header>
      <Card.Content>
        <table>
          <thead>
            <th>Expression</th>
            <th>Keyword</th>
          </thead>
          <tbody>
            {#each bindedExpressions as binded}
              <tr>
                <td>{binded.expression}</td>
                <td>{binded.name}</td>
              </tr>
            {/each}
          </tbody>
        </table>

        <form on:submit|preventDefault={bindExpressionHotkey}>
          <select name="expression">
            {#each expressions as expression}
              <option value={expression}>{expression}</option>
            {/each}
          </select>
          <select name="hotkey">
            {#each hotkeys as hotkey}
              <option value={hotkey.hotkeyID}>{hotkey.name}</option>
            {/each}
          </select>
          <Button type="submit" size="icon">
            <Send class="h-4 w-4" />
          </Button>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
