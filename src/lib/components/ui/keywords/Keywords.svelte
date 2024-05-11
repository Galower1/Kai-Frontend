<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Send } from "lucide-svelte";
  import { createEventDispatcher } from "svelte";

  let expression = "";

  const dispatch = createEventDispatcher();

  function emitExpression() {
    dispatch("expression", { expression });
  }
</script>

<Card.Root class="w-[480px]">
  <Card.Header>
    <Card.Title>Keywords</Card.Title>
    <Card.Description>Add keywords for Vtube Studio</Card.Description>
  </Card.Header>
  <Card.Content>
    <form on:submit|preventDefault={emitExpression}>
      <Input placeholder="New Reaction" bind:value={expression} />
      <Button type="submit" size="icon">
        <Send class="h-4 w-4" />
      </Button>
    </form>
  </Card.Content>
</Card.Root>
