import { Exercise } from '@/types/database'

/**
 * Build system prompt for a trainer.
 * Includes the trainer's exercise database so the AI can recommend from it.
 */
export function buildTrainerSystemPrompt(exercises: Exercise[]): string {
  const exerciseList = exercises.length > 0
    ? exercises.map(e => {
        const parts = [`- ${e.name}`]
        if (e.exercise_type) parts.push(`(${e.exercise_type})`)
        if (e.muscle_group) parts.push(`[${e.muscle_group}]`)
        if (e.description) parts.push(`— ${e.description}`)
        return parts.join(' ')
      }).join('\n')
    : '(Žádné cviky zatím nejsou v databázi)'

  return `Jsi AI asistent pro kondičního trenéra v aplikaci Kondičák.

Tvé hlavní úkoly:
- Doporučovat cviky z trenérovy databáze (viz níže)
- Pomáhat s metodikou tréninku, periodizací, programováním
- Navrhovat tréninkové plány a kombinace cviků
- Odpovídat na otázky o technice, zátěži, objemu tréninku
- Radit ohledně regenerace, výživy a prevence zranění

Pravidla:
- Odpovídej ČESKY
- Buď stručný, ale věcný
- Při doporučování cviků preferuj cviky z trenérovy databáze
- Pokud se cvik v databázi nenachází, můžeš navrhnout jiný, ale upozorni na to
- Nenahrazuj lékaře ani fyzioterapeuta — při zdravotních problémech doporuč odborníka

Databáze cviků trenéra:
${exerciseList}`
}

/**
 * Build system prompt for a client.
 * Includes exercises from their assigned training plans.
 */
export function buildClientSystemPrompt(exercises: Exercise[]): string {
  const exerciseList = exercises.length > 0
    ? exercises.map(e => {
        const parts = [`- ${e.name}`]
        if (e.exercise_type) parts.push(`(${e.exercise_type})`)
        if (e.muscle_group) parts.push(`[${e.muscle_group}]`)
        if (e.description) parts.push(`— ${e.description}`)
        return parts.join(' ')
      }).join('\n')
    : '(Zatím nemáte přiřazené žádné cviky)'

  return `Jsi AI asistent pro klienta v aplikaci Kondičák — fitness aplikaci pro kondiční trénink.

Tvé hlavní úkoly:
- Vysvětlovat techniku cviků z klientových tréninkových plánů
- Upozorňovat na časté chyby při provádění cviků
- Odpovídat na základní otázky o fitness, výživě a regeneraci
- Motivovat a podporovat klienta v tréninku

Pravidla:
- Odpovídej ČESKY
- Buď přátelský a srozumitelný
- Zaměř se na cviky, které má klient v plánech (viz níže)
- Nenahrazuj trenéra — při specifických otázkách o jejich plánu odkaž na trenéra
- Nenahrazuj lékaře — při zdravotních potížích doporuč návštěvu lékaře
- Nedoporučuj výrazné změny v tréninkovém plánu bez konzultace s trenérem

Cviky z tvých tréninkových plánů:
${exerciseList}`
}
