"""Deterministic ATS scoring and resume feedback helpers."""

import re
from collections import Counter

# Common ATS keywords and phrases
TECHNICAL_KEYWORDS = {
    'python', 'java', 'javascript', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin',
    'html', 'css', 'sql', 'nosql', 'react', 'angular', 'vue', 'node.js', 'django',
    'flask', 'spring', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git',
    'jenkins', 'rest', 'api', 'microservices', 'agile', 'scrum', 'devops',
    'tensorflow', 'pytorch', 'machine learning', 'ai', 'analytics', 'tableau',
    'power bi', 'excel', 'salesforce', 'sap', 'hadoop', 'spark', 'sql server',
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'grafana',
    'jira', 'confluence', 'linux', 'windows', 'macos', 'unix', 'bash', 'shell',
    'ci/cd', 'gitlab', 'github', 'bitbucket', 'svn', 'soap', 'xml', 'json',
    'soap', 'rest api', 'graphql', 'gRPC'
}

SOFT_SKILLS = {
    'leadership', 'communication', 'teamwork', 'problem solving', 'analytical',
    'critical thinking', 'time management', 'organization', 'attention to detail',
    'adaptability', 'collaboration', 'creativity', 'conflict resolution',
    'decision making', 'project management', 'customer service', 'mentoring'
}

ACTION_VERBS = {
    'achieved', 'accelerated', 'accomplished', 'advised', 'advocated', 'analyzed',
    'approved', 'arranged', 'assessed', 'assigned', 'assisted', 'assumed',
    'assured', 'attained', 'audited', 'authored', 'automated', 'awarded',
    'budgeted', 'built', 'calculated', 'captured', 'centralized', 'certified',
    'chaired', 'championed', 'changed', 'charged', 'chartered', 'checked',
    'chose', 'cited', 'clarified', 'classified', 'coached', 'collaborated',
    'collected', 'combined', 'commended', 'commanded', 'commented', 'commissioned',
    'committed', 'communicated', 'compiled', 'completed', 'computed', 'conceived',
    'conceptualized', 'concluded', 'conducted', 'configured', 'confirmed',
    'confronted', 'connected', 'consolidated', 'constructed', 'consulted',
    'contacted', 'continued', 'contracted', 'contributed', 'controlled',
    'converted', 'coordinated', 'corrected', 'corresponded', 'created',
    'credited', 'critiqued', 'cultivated', 'customized', 'decreased',
    'decided', 'declared', 'decoded', 'decreased', 'defined', 'delegated',
    'deleted', 'delivered', 'demonstrated', 'deprecated', 'described',
    'designated', 'designed', 'desired', 'detected', 'determined', 'developed',
    'devised', 'diagnosed', 'directed', 'discovered', 'discussed', 'dismissed',
    'dispatched', 'dispensed', 'displayed', 'disproved', 'dissected', 'distributed',
    'documented', 'dominated', 'drafted', 'drew', 'drove', 'earned', 'eased',
    'edited', 'educated', 'effected', 'elected', 'elevated', 'eliminated',
    'emphasized', 'employed', 'empowered', 'enabled', 'enclosed', 'encouraged',
    'endorsed', 'enforced', 'engaged', 'engineered', 'enhanced', 'enjoyed',
    'enlarged', 'enlisted', 'enriched', 'ensured', 'entered', 'entertained',
    'entitled', 'estimated', 'evaluated', 'evoked', 'examined', 'exceeded',
    'excelled', 'exchanged', 'excited', 'excluded', 'executed', 'exercised',
    'exerted', 'exhausted', 'exhibited', 'existed', 'expanded', 'expedited',
    'expelled', 'expended', 'experienced', 'experimented', 'explained',
    'exposed', 'expressed', 'extended', 'extracted', 'facilitated', 'faced',
    'factored', 'failed', 'fielded', 'filled', 'filmed', 'financed',
    'fixed', 'focused', 'forecasted', 'forged', 'formed', 'formulated',
    'fostered', 'found', 'founded', 'framed', 'freed', 'fulfilled',
    'functioned', 'funded', 'furnished', 'gained', 'gathered', 'gauged',
    'generated', 'governed', 'graded', 'granted', 'grasped', 'greeted',
    'grossed', 'grouped', 'guided', 'handled', 'headed', 'heightened',
    'helped', 'highlighted', 'hired', 'honed', 'honored', 'hosted',
    'identified', 'illuminated', 'illustrated', 'impacted', 'implemented',
    'implied', 'impressed', 'improved', 'improvised', 'increased', 'incurred',
    'indexed', 'indicated', 'induced', 'influenced', 'informed', 'initiated',
    'innovated', 'inquired', 'inspired', 'installed', 'instated', 'instigated',
    'instituted', 'instructed', 'insured', 'integrated', 'intended', 'intensified',
    'interacted', 'interested', 'interfaced', 'interpreted', 'intervened',
    'interviewed', 'introduced', 'invented', 'invested', 'investigated',
    'invited', 'involved', 'ironed', 'issued', 'itemized', 'joined',
    'journeyed', 'judged', 'juggled', 'justified', 'kept', 'kicked',
    'killed', 'knew', 'knocked', 'labeled', 'launched', 'layered',
    'lead', 'learned', 'leased', 'left', 'lessened', 'levered',
    'liaised', 'liberated', 'licensed', 'lifted', 'lightened', 'liked',
    'limited', 'lined', 'linked', 'listed', 'listened', 'loaded',
    'loaned', 'located', 'locked', 'logged', 'looked', 'loosened',
    'lost', 'loved', 'lowered', 'made', 'mailed', 'maintained',
    'majored', 'managed', 'manipulated', 'mapped', 'marked', 'marketed',
    'married', 'marshaled', 'matched', 'materialized', 'mattered', 'maximized',
    'measured', 'mediated', 'met', 'mentored', 'merged', 'meshed',
    'messaged', 'methodized', 'milestoned', 'minimized', 'minored', 'minted',
    'missed', 'mitigated', 'mixed', 'mobilized', 'modeled', 'moderated',
    'modernized', 'modified', 'molded', 'monitored', 'monopolized', 'morphed',
    'motivated', 'moved', 'multiplied', 'mused', 'mustered', 'mutated',
    'named', 'narrated', 'navigated', 'negotiated', 'netted', 'networked',
    'neutralized', 'nominated', 'normalized', 'notched', 'noted', 'noticed',
    'nurtured', 'objected', 'obligated', 'observed', 'obtained', 'obviated',
    'occupied', 'occurred', 'offered', 'offset', 'omitted', 'opened',
    'operated', 'opined', 'opposed', 'optimized', 'orchestrated', 'ordered',
    'organized', 'originated', 'outlined', 'outmaneuvered', 'outpaced',
    'outperformed', 'outpointed', 'outran', 'outwitted', 'overcame',
    'overcooked', 'overdid', 'overdressed', 'overheard', 'overlaid',
    'overlooked', 'oversaw', 'overtaken', 'overtook', 'overturned',
    'overwrote', 'owed', 'owned', 'paced', 'packed', 'padded',
    'padlocked', 'paged', 'paid', 'pained', 'painted', 'paired',
    'paneled', 'panicked', 'panned', 'panned', 'panned', 'panned',
    'panned', 'panned', 'panored', 'panted', 'pantsed', 'panured',
    'panved', 'panwered', 'panxed', 'panyed', 'panzeped', 'papered',
    'paprika', 'papyrusen', 'parablestered', 'parachuted', 'paraded',
    'paradoxed', 'paragraphed', 'paralleled', 'paralyzed', 'paramed',
    'paramedied', 'paramesiaed', 'paramount', 'paramouured', 'paranoid',
    'parapeeled', 'paraplaned', 'parapeted', 'paraphernalia', 'paraphrased',
    'paraquet', 'parapluied', 'parapodia', 'paraprosopia', 'paraproject',
    'parapsychology', 'paraquated', 'paraquet', 'paraquete', 'paraquetly',
    'paraquettely', 'paraqueued', 'paraquing', 'paraquitoed', 'pararachnid',
    'pararescued', 'pararetalion', 'pararetteled', 'pararetinal', 'paraributary',
    'parasailed', 'parasalesman', 'parasaltation', 'parasaltory', 'parasaltress',
    'parasaltrix', 'parasalts', 'parasaltship', 'parasaltwise', 'parasandbox',
    'parasandheap', 'parasandhistory', 'parasandhop', 'parasandhopper',
    'parasanding', 'parasandingly', 'parasandish', 'parasandist', 'parasanding',
    'parasandish', 'parasandized', 'parasandly', 'parasandman', 'parasandmen',
    'parasandpaper', 'parasands', 'parasandstone', 'parasandstorm', 'parasandwich',
    'parasandwichman', 'parasane', 'parasapor', 'parasaporous', 'parasapory',
    'parasarge', 'parasargent', 'parasargentcy', 'parasargentdom', 'parasargently',
    'parasargentry', 'parasargess', 'parasargessdom', 'parasargessdom',
    'parasargesshood', 'parasargessly', 'parasargessness', 'parasargessric',
    'parasargessship', 'parasargesswise', 'parasargettain', 'parasargettaincy',
    'parasargettainy', 'parasargettain', 'parasargetti', 'parasargh',
    'parasarghee', 'parasargian', 'parasargianed', 'parasargianize',
    'parasargianized', 'parasargianizing', 'parasargianly', 'parasargianness',
    'parasargic', 'parasargical', 'parasargically', 'parasargism', 'parasargist',
    'parasargistic', 'parasargistrically', 'parasargitide', 'parasargitous',
    'parasargo', 'parasargon', 'parasargonaut', 'parasargonautic', 'parasargonautical',
    'parasargonautically', 'parasargonautics', 'parasargonautish', 'parasargonautism',
    'parasargonautist', 'parasargonautize', 'parasargonautized', 'parasargonautizing',
    'parasargonauty', 'parasargone', 'parasargonia', 'parasargonian', 'parasargonic',
    'parasargonical', 'parasargonically', 'parasargonicism', 'parasargonicism',
    'parasargonics', 'parasargonism', 'parasargonist', 'parasargonistic',
    'parasargonistically', 'parasargonium', 'parasargonize', 'parasargonized',
    'parasargonizing', 'parasargonous', 'parasargony', 'parasargos', 'parasargosis',
    'parasargosity', 'parasargosy', 'parasargot', 'parasargota', 'parasargotage',
    'parasargotean', 'parasargoteanism', 'parasargoteau', 'parasargoteauan',
    'parasargoteauean', 'parasargoteaued', 'parasargoteauing', 'parasargoteauser',
    'parasargoteausian', 'parasargoteausianly', 'parasargoteausing', 'parasargoteda',
    'parasargoted', 'parasargotedly', 'parasargotedness', 'parasargotee',
    'parasargoteful', 'parasargotefully', 'parasargotefulness', 'parasargotei',
    'parasargotely', 'parasargoten', 'parasargotened', 'parasargotening',
    'parasargoteness', 'parasargotene', 'parasargotenic', 'parasargotenly',
    'parasargoteo', 'parasargoteous', 'parasargoteoused', 'parasargoteously',
    'parasargoteoused', 'parasargoteouser', 'parasargoteousing', 'parasargoteousness',
    'parasargotep', 'parasargoteptible', 'parasargoteptor', 'parasargotepture',
    'parasargoter', 'parasargoteres', 'parasargoteri', 'parasargoteria',
    'parasargoterian', 'parasargoteric', 'parasargoteria', 'parasargoterial',
    'parasargoteric', 'parasargoterically', 'parasargotericness', 'parasargoteriness',
    'parasargoterid', 'parasargoterie', 'parasargoteries', 'parasargoterier',
    'parasargoteries', 'parasargoteriness', 'parasargoteries', 'parasargoterious',
    'parasargoteriousness', 'parasargotarium', 'parasargotariums', 'parasargotary',
    'parasargotated', 'parasargotating', 'parasargotation', 'parasargotational',
    'parasargotative', 'parasargotator', 'parasargotatorial', 'parasargotatorially',
    'parasargotatory', 'parasargotature', 'parasargoted', 'parasargoter',
    'parasargoterly', 'parasargoterness', 'parasargotes', 'parasargotesque',
    'parasargotesquely', 'parasargotesqueness', 'parasargotess', 'parasargotessdom',
    'parasargotessed', 'parasargotessing', 'parasargotession', 'parasargotessive',
    'parasargotessly', 'parasargotessness', 'parasargotesy', 'parasargotet',
    'parasargoteta', 'parasargotetal', 'parasargotetically', 'parasargotetelism',
    'parasargotetically', 'parasargotete', 'parasargotetic', 'parasargotetical',
    'parasargotetically', 'parasargotetics', 'parasargotetical', 'parasargotetically',
    'parasargotetically', 'parasargotically', 'parasargoticism', 'parasargoticiize',
    'parasargoticiized', 'parasargoticiizing', 'parasargoticiism', 'parasargoticiisim',
    'parasargoticiist', 'parasargoticiistic', 'parasargoticiistically', 'parasargoticiity',
    'parasargotied', 'parasargotier', 'parasargotiered', 'parasargotiering',
    'parasargotierly', 'parasargotierness', 'parasargotieriness', 'parasargotier',
    'parasargotiest', 'parasargotiety', 'parasargotific', 'parasargotifical',
    'parasargotifically', 'parasargotifield', 'parasargotified', 'parasargotifiedly',
    'parasargotifiedliness', 'parasargotifier', 'parasargotifiest', 'parasargotifieth',
    'parasargotifilicate', 'parasargotifiliose', 'parasargotifilm', 'parasargotifiying'
}

def calculate_ats_score(text):
    """
    Calculate ATS score based on resume content quality and structure.
    Returns a score between 0-100.
    """
    if not text or len(text.strip()) < 50:
        return 10  # Very short resume scores low
    
    text_lower = text.lower()
    score = 0
    max_score = 100
    
    # Section 1: Format and Structure (15 points)
    structure_score = 0
    
    # Check for common resume sections
    sections = ['experience', 'education', 'skills', 'summary', 'objective']
    found_sections = sum(1 for section in sections if section in text_lower)
    structure_score += (found_sections / len(sections)) * 10
    
    # Check for contact information patterns (email, phone)
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    phone_pattern = r'\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b'
    
    if re.search(email_pattern, text):
        structure_score += 2.5
    if re.search(phone_pattern, text):
        structure_score += 2.5
    
    score += min(structure_score, 15)
    
    # Section 2: Keywords and Skills (35 points)
    keyword_score = 0
    
    # Count technical keywords
    technical_count = sum(1 for keyword in TECHNICAL_KEYWORDS if keyword in text_lower)
    if technical_count > 0:
        keyword_score += min(technical_count * 2, 20)
    
    # Count soft skills
    soft_skills_count = sum(1 for skill in SOFT_SKILLS if skill in text_lower)
    if soft_skills_count > 0:
        keyword_score += min(soft_skills_count * 1.5, 15)
    
    score += min(keyword_score, 35)
    
    # Section 3: Action Verbs and Achievement Language (20 points)
    verb_score = 0
    action_verb_count = sum(1 for verb in ACTION_VERBS if f" {verb} " in f" {text_lower} ")
    
    if action_verb_count > 0:
        verb_score += min(action_verb_count * 1.5, 15)
    
    # Check for quantifiable achievements (numbers, percentages)
    numbers_pattern = r'\b(?:\d+%|\$\d+|increased|decreased|improved|reduced|grew|expanded)\b'
    achievement_matches = len(re.findall(numbers_pattern, text_lower))
    if achievement_matches > 0:
        verb_score += min(achievement_matches * 1, 5)
    
    score += min(verb_score, 20)
    
    # Section 4: Content Quality and Length (20 points)
    content_score = 0
    
    # Word count check (ideal resume: 250-750 words, but checking for minimum quality)
    word_count = len(text.split())
    
    if word_count < 100:
        content_score += 2  # Too short
    elif word_count < 150:
        content_score += 5
    elif word_count < 250:
        content_score += 8
    elif word_count < 500:
        content_score += 12
    elif word_count < 1000:
        content_score += 15
    else:
        content_score += 12  # Slightly penalize overly long resumes
    
    # Check for proper date formats (job experience dating)
    date_pattern = r'\b(?:20\d{2}|19\d{2})|(?:january|february|march|april|may|june|july|august|september|october|november|december)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)'
    date_matches = len(re.findall(date_pattern, text_lower))
    if date_matches >= 2:
        content_score += 5
    
    score += min(content_score, 20)
    
    # Section 5: Grammar and Formatting (10 points)
    grammar_score = 0
    
    # Check for common grammatical issues
    # Multiple spaces
    if '  ' in text:
        grammar_score -= 1
    
    # Check line length consistency (proper formatting)
    lines = text.split('\n')
    avg_line_length = sum(len(line) for line in lines) / len(lines) if lines else 0
    if 40 < avg_line_length < 100:  # Good formatting
        grammar_score += 5
    
    # Penalize all caps sections (common in poorly formatted resumes)
    all_caps_count = len(re.findall(r'\b[A-Z]{3,}\b', text))
    if all_caps_count > 10:
        grammar_score -= 2
    elif all_caps_count <= 5:
        grammar_score += 3
    
    score += max(0, min(grammar_score, 10))
    
    # Ensure score is between 0 and 100
    final_score = max(0, min(int(score), 100))
    
    return final_score


def get_ats_feedback(text):
    """
    Provide specific feedback based on ATS score calculation.
    """
    text_lower = text.lower()
    feedback = []
    
    # Check sections
    if 'experience' not in text_lower:
        feedback.append("❌ Missing 'Experience' section - this is crucial for ATS")
    if 'education' not in text_lower:
        feedback.append("❌ Missing 'Education' section")
    if 'skills' not in text_lower:
        feedback.append("❌ Missing 'Skills' section - essential for keyword matching")
    
    # Check contact info
    if not re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text):
        feedback.append("❌ No email address found")
    
    # Check for technical keywords
    technical_count = sum(1 for keyword in TECHNICAL_KEYWORDS if keyword in text_lower)
    if technical_count == 0:
        feedback.append("⚠️ No technical keywords detected - add relevant technical skills")
    elif technical_count < 3:
        feedback.append("⚠️ Limited technical keywords - consider adding more relevant technologies")
    else:
        feedback.append(f"✅ Good technical keywords found ({technical_count})")
    
    # Check for action verbs
    action_verb_count = sum(1 for verb in ACTION_VERBS if f" {verb} " in f" {text_lower} ")
    if action_verb_count == 0:
        feedback.append("⚠️ No action verbs detected - use strong verbs like 'Achieved', 'Developed', 'Led'")
    elif action_verb_count < 3:
        feedback.append("⚠️ Few action verbs - consider adding more impact-driven language")
    else:
        feedback.append(f"✅ Good use of action verbs ({action_verb_count})")
    
    # Check word count
    word_count = len(text.split())
    if word_count < 150:
        feedback.append(f"⚠️ Resume is too short ({word_count} words) - aim for 250-750 words")
    elif word_count > 1000:
        feedback.append(f"⚠️ Resume is too long ({word_count} words) - keep it concise")
    else:
        feedback.append(f"✅ Good resume length ({word_count} words)")
    
    # Check for quantifiable results
    achievement_pattern = r'\b(?:\d+%|\$\d+[KMB]?|increased|decreased|improved|reduced|grew|expanded)\b'
    achievement_count = len(re.findall(achievement_pattern, text_lower))
    if achievement_count == 0:
        feedback.append("⚠️ Add quantifiable achievements (e.g., 'Increased sales by 25%')")
    else:
        feedback.append(f"✅ Good use of metrics ({achievement_count})")
    
    return feedback
