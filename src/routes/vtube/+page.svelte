<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { toast } from "svelte-sonner";
  import { RefreshCcw } from "lucide-svelte";

  // Setup socket.io client
  import { io } from "socket.io-client";
  import { VtubeSocket } from "$lib";
  import Keywords from "$lib/components/ui/keywords/Keywords.svelte";
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
    // for (const hotkey of hotkeys) {
    //   if (data.toLocaleLowerCase().includes(hotkey)) {
    //   }
    // }
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

  function addExpression(event: CustomEvent<any>) {
    if (!expressions.includes(event.detail.expression)) {
      expressions = [...expressions, event.detail.expression];
    }
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
    <Keywords on:expression={addExpression} />
  </div>
</div>
