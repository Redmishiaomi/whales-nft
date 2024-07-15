root: traits/
output: output/images/
seed: whales gonna whale
count: 10000
logo: logo.gif
cover: cover.gif
name_aliases: trait_names.csv

meta:
  name: Whales Club
  description: Collection limited to 10000 utility-enabled NFTs, where the token is your membership to the Whales Club. Have access to the most profitable Ton Whales decentralized staking pools, networking system, the latest news from Whales Corp. and many other useful club privileges.
  item_pattern: 'Whale #{{idx}}'
  external_url: https://tonwhales.com/club
  social_links:
    - https://t.me/tonwhalesnft
    - https://t.me/tonwhalesnften
    - https://twitter.com/whalescorp

perks:
  Ton Cashback:
    path: tiers/Usual/Staking/8-tale/ton cashback
    layer: 8-tale
    levels:
      - name: gold
        count: 3
      - name: silver
        count: 10
      - name: bronze
        count: 25
    distribution:
      special: 19
      others: 19

custom:
  - name: Black People
    count: 500
    path: tiers/Usual/Black People
    uses:
      - 1-background
  - name: Miner
    count: 200
    path: tiers/Usual/Miner
    uses:
      - 1-background
      - 4-eye
  - name: Women
    count: 800
    path: tiers/Usual/Women
    uses:
      - 1-background
    layers:
      - path: 13-lips
        name: Lips
        rarity: 1
      - path: 14-hair
        name: Hair
        rarity: 1
  - name: Legendary
    count: 42
    path: tiers/Legendary
    special: true
    overrides:
      90s: 
        7-glasses: 1
      Wild West:
        5-neck: 1
        9-hand: 1
        10-hats: 1
      UAE Desert:
        10-hats: 1
        7-glasses: 1
        9-hand: 1
      Santa Village:
        10-hats: 1
        9-hand: 1
      Wizard:
        9-hand: 1
        10-hats: 1
      Matrix:
        10-hats: 1
        7-glasses: 1
      China Town:
        10-hats: 1
      Hood:
        10-hats: 1
      Paradise:
        9-hand: 1
        10-hats: 1
        11-habits: 0.8
      Wall Street:
        9-hand: 1
      Space:
        12-flags: 0.5
      Ninja School:
        9-hand: 1
      Hell:
        9-hand: 1

    # counts:
    #   90s: 54
    #   China Town: 384
    #   Egypt Mummy: 48
    #   Hell: 2
    #   Hood: 12096
    #   Matrix: 48
    #   Ninja School: 270
    #   Paradise: 18
    #   Santa Village: 240
    #   Space: 576
    #   UAE Desert: 1344
    #   Wall Street: 15552
    #   Wild West: 240
    #   Wizard: 240


layers:
  - path: 1-background
    name: Background
    rarity: 1
    overrides:
      bg_15: 0.5
      bg_18: 0.5
      bg_6: 0.7
      bg_7: 0.7
      bg_8: 0.7
      bg_9: 0.7
      bg_10: 0.7
      bg_11: 0.7
      bg_12: 0.7
      bg_13: 0.7
      bg_14: 0.7
  - path: 2-body_belly
    name: Belly
    rarity: 1
  - path: 3-body_back
    name: Back
    rarity: 1
    overrides:
      body_back_2: 0.7
      body_back_5: 0.7
  - path: 3.5-clothes
    name: Clothes
    rarity: 1
  - path: 3.7-tooth
    name: Teeth
    rarity: 0.6
  - path: 4-eye
    rarity: 1
    name: Eye
    overrides:
      eye_5: 0.5
      eye_7: 0.5
  - path: 5-neck
    rarity: 0.5
    name: Neck
    overrides:
      '1':
        cannot_be_with:
          - 11-habits/tobacco_pipe
      '2':
        cannot_be_with:
          - 11-habits/tobacco_pipe
      '3':
        cannot_be_with:
          - 11-habits/tobacco_pipe
      '4':
        cannot_be_with:
          - 11-habits/tobacco_pipe
  - path: 6-tooth
    rarity: 0.6
    name: Tooth
    cannot_be_with:
      - 11-habits
  - path: 7-glasses
    rarity: 0.4
    name: Glasses
    # overrides:
    #   black:
    #     cannot_be_with:
    #       - 4-eye
    #   rainbow:
    #     cannot_be_with:
    #       - 4-eye

  - path: 8-tale
    rarity: 0.35
    name: Tale
    overrides:
      '14': 0.7

  - path: 8.5-clothes
    rarity: 1
    name: Clothes

  - path: 9-hand
    name: Hand
    rarity: 0.1
  - path: 10-hats
    name: Hat
    rarity: 0.7
    overrides:
      '4':
        cannot_be_with:
          - 7-glasses
          - 3-body_back/body_back_3
          - 3-body_back/body_back_5
          - 3-body_back/body_back_6
      '6':
        cannot_be_with:
          - 7-glasses
      '12':
        cannot_be_with:
          - 7-glasses
      '13':
        cannot_be_with:
          - 7-glasses
      '14':
        cannot_be_with:
          - 7-glasses
      '15':
        cannot_be_with:
          - 7-glasses
      '18':
        cannot_be_with:
          - 7-glasses
      '20':
        cannot_be_with:
          - 7-glasses
      '21':
        cannot_be_with:
          - 7-glasses

  - path: 11-habits
    rarity: 0.2
    name: Habit
    cannot_be_with:
      - 6-tooth

  - path: 12-flags
    rarity: 0.05
    name: Flag
    cannot_be_with:
      - 9-hand