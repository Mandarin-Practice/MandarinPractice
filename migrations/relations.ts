import { relations } from "drizzle-orm/relations";
import { users, learnedDefinitions, characterDefinitions, characters, characterCompounds, wordProficiency } from "./schema";

export const learnedDefinitionsRelations = relations(learnedDefinitions, ({one}) => ({
	user: one(users, {
		fields: [learnedDefinitions.userId],
		references: [users.id]
	}),
	characterDefinition: one(characterDefinitions, {
		fields: [learnedDefinitions.definitionId],
		references: [characterDefinitions.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	learnedDefinitions: many(learnedDefinitions),
	wordProficiencies: many(wordProficiency),
}));

export const characterDefinitionsRelations = relations(characterDefinitions, ({one, many}) => ({
	learnedDefinitions: many(learnedDefinitions),
	character: one(characters, {
		fields: [characterDefinitions.characterId],
		references: [characters.id]
	}),
}));

export const charactersRelations = relations(characters, ({many}) => ({
	characterDefinitions: many(characterDefinitions),
	characterCompounds_compoundId: many(characterCompounds, {
		relationName: "characterCompounds_compoundId_characters_id"
	}),
	characterCompounds_componentId: many(characterCompounds, {
		relationName: "characterCompounds_componentId_characters_id"
	}),
}));

export const characterCompoundsRelations = relations(characterCompounds, ({one}) => ({
	character_compoundId: one(characters, {
		fields: [characterCompounds.compoundId],
		references: [characters.id],
		relationName: "characterCompounds_compoundId_characters_id"
	}),
	character_componentId: one(characters, {
		fields: [characterCompounds.componentId],
		references: [characters.id],
		relationName: "characterCompounds_componentId_characters_id"
	}),
}));

export const wordProficiencyRelations = relations(wordProficiency, ({one}) => ({
	user: one(users, {
		fields: [wordProficiency.userId],
		references: [users.id]
	}),
}));